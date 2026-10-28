# Documents Use an Allow List, and Response Headers Are the Real Control

Date: 2026-10-15

Status: accepted

## Context

[#836](https://github.com/NWACus/web/issues/836) asked for the Documents collection to accept "all file types except images and videos," since images and videos belong in `Media`. Payload's `upload.mimeTypes` is an allow list, so the obvious reading is to drop it and enforce the exclusion in a hook. Investigating that turned up three things that make the obvious approach wrong.

**`mimeTypes` and Payload's restricted-type list are mutually exclusive code paths.** `checkFileRestrictions` branches on whether `mimeTypes` is set. With it set, Payload sniffs the actual bytes with `fileTypeFromBuffer` and validates the detected type. With it absent, it compares the filename extension and the client-supplied mimetype against a small blocked list and never inspects bytes — so renaming `evil.exe` to `report.pdf` and declaring `application/pdf` sails through. Dropping the allow list trades real byte verification for a check a rename defeats. `allowRestrictedFileTypes: true` skips validation entirely, SVG sanitization and PDF validation included.

**Only `beforeOperation` runs before the check.** The collection operation order is `beforeOperation` → `generateFileData`/`checkFileRestrictions` → `beforeValidate` → `beforeChange`, so a hook anywhere later throws after Payload has already rejected or accepted the file.

**Documents are served first-party.** Document URLs are relative (`/api/documents/file/<name>`) and proxied through Payload from Vercel Blob, so they come from the site's own origin rather than an isolated asset domain. Production responses carried `Content-Disposition: inline` with no `X-Content-Type-Options` and a year of CDN caching. Markup stored here would execute in the site's origin.

Two gaps mean the allow list cannot be the security boundary on its own:

- `clientUploads: true` sends files straight from the browser to Vercel Blob, so the bytes are stored before anything checks them. As of Payload 3.90.2 the server does still check them afterwards: because Documents sets `mimeTypes`, `getFileContentRequirement` asks for the full file, and `getFileFromClientUpload` streams the blob back into a temp file before the operation runs. `checkFileRestrictions` and our hooks then see the real bytes, but through `req.file.tempFilePath` with an empty `req.file.data`, so any hook that reads the bytes has to handle both. A rejected upload leaves its blob behind in storage, though no Document points to it, so the site never serves it.
- For files with no magic bytes, Payload falls back to `getFileTypeFallback`, which reports `text/plain` for unmapped extensions — including `.pdf`. Its `validatePDF` branch therefore never runs, and HTML bytes named `report.pdf` pass the allow list.

## Decision

Keep an allow list, and treat the response headers as the actual control.

- `DOCUMENT_MIME_TYPES` enumerates what Documents accepts. Images and videos are excluded by construction, which satisfies #836 without giving up byte sniffing. Executables are excluded for the same reason, so no separate deny list is needed.
- Every entry has to match a type Payload can actually detect. Legacy Office files (`.doc`, `.xls`, `.ppt`) are detected as the generic `application/x-cfb` container, which `.msi` installers share, and KMZ is detected as `application/zip`. Their own MIME types would never match, and allowing the container types would let installers and arbitrary archives through, so those formats are not accepted. Editors can save as `.docx`/`.xlsx`/`.pptx` or `.kml`.
- `application/json` is allowed for config files hosted for other tools, such as AFP weather table templates. It has no magic bytes, so Payload types it from the `.json` extension, and it is served as an attachment like everything else but PDF. JSON responses also carry `Access-Control-Allow-Origin: *` so other sites can fetch them, and `Cache-Control: public, max-age=3600` in place of the storage plugin's one-year default so a corrected file is picked up within an hour. `*` was chosen over adding origins to Payload's `cors` list, which applies to the whole API and sends `Access-Control-Allow-Credentials: true`.
- `text/html`, `application/xhtml+xml`, and `image/svg+xml` are never allowed. `application/octet-stream` was dropped as a catch-all that defeats the point of the list.
- `application/xml` and `text/xml` stay, because `fileTypeFromBuffer` reports KML and GPX as `application/xml` and Payload validates the *detected* type. Removing them breaks geospatial uploads.
- `modifyDocumentResponseHeaders` sets `X-Content-Type-Options: nosniff` on every response and forces `Content-Disposition: attachment` for everything except PDF. This holds even for uploads that skipped the server-side checks.
- `rejectMismatchedFileContent` (a `beforeOperation` hook) rejects HTML/SVG content under any filename and requires `%PDF-` for anything named `.pdf`, closing the fallback gap. It reads the leading bytes from the temp file when `req.file.data` is empty, so it covers client uploads too.
- Only inline-safe types (PDF) can be embedded. The Document block's `displayAs` field rejects `embed` for any other document, and the block component falls back to a download link if older content embeds one anyway, since an attachment in an iframe downloads on every page view.

## Consequences

- Adding a new document type means editing `DOCUMENT_MIME_TYPES`. That is the intended cost: the list is the thing keeping byte verification switched on.
- The served `Content-Type` comes from the blob's metadata, which on the client-upload path is whatever the browser declared. The server-side checks reject a mismatched file before a Document is created, and `nosniff` plus `attachment` contain anything that gets past them.
- Hooks that inspect upload bytes must read `tempFilePath` when `data` is empty. Tests that only build `req.file` from a buffer miss the production path, because local development without a Blob token uses ordinary multipart uploads.
- PDFs remain `inline` so the Document block's embed layout keeps working. Any new inline-rendered type must be added to `INLINE_SAFE_MIME_TYPES` deliberately, with the first-party origin in mind.
- There is still no size cap on client uploads: `maximumSizeInBytes` is not reachable through the plugin's public options, and we chose not to carry a `@payloadcms/storage-vercel-blob` patch for it. The largest document in production is ~51MB, so nothing is near a practical ceiling today; revisit if that changes.
- `Media` gets the same full read-back only while it sets `mimeTypes`. Without an allow list, `getFileContentRequirement` fetches just an image header or nothing at all, so server-side checks there would see partial or empty bytes.
