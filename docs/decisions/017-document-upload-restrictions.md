# Documents Use an Allow List, and Response Headers Are the Real Control

Date: 2026-08-31

Status: accepted

## Context

[#836](https://github.com/NWACus/web/issues/836) asked for the Documents collection to accept "all file types except images and videos," since images and videos belong in `Media`. Payload's `upload.mimeTypes` is an allow list, so the obvious reading is to drop it and enforce the exclusion in a hook. Investigating that turned up three things that make the obvious approach wrong.

**`mimeTypes` and Payload's restricted-type list are mutually exclusive code paths.** `checkFileRestrictions` branches on whether `mimeTypes` is set. With it set, Payload sniffs the actual bytes with `fileTypeFromBuffer` and validates the detected type. With it absent, it compares the filename extension and the client-supplied mimetype against a small blocked list and never inspects bytes — so renaming `evil.exe` to `report.pdf` and declaring `application/pdf` sails through. Dropping the allow list trades real byte verification for a check a rename defeats. `allowRestrictedFileTypes: true` skips validation entirely, SVG sanitization and PDF validation included.

**Only `beforeOperation` runs before the check.** The collection operation order is `beforeOperation` → `generateFileData`/`checkFileRestrictions` → `beforeValidate` → `beforeChange`, so a hook anywhere later throws after Payload has already rejected or accepted the file.

**Documents are served first-party.** Document URLs are relative (`/api/documents/file/<name>`) and proxied through Payload from Vercel Blob, so they come from the site's own origin rather than an isolated asset domain. Production responses carried `Content-Disposition: inline` with no `X-Content-Type-Options` and a year of CDN caching. Markup stored here would execute in the site's origin.

Two gaps mean the allow list cannot be the security boundary on its own:

- `clientUploads: true` sends files straight from the browser to Vercel Blob. Neither `checkFileRestrictions` nor any collection hook ever sees the bytes, so in preview and production the allow list was not being enforced at all.
- For files with no magic bytes, Payload falls back to `getFileTypeFallback`, which reports `text/plain` for unmapped extensions — including `.pdf`. Its `validatePDF` branch therefore never runs, and HTML bytes named `report.pdf` pass the allow list.

## Decision

Keep an allow list, and treat the response headers as the actual control.

- `DOCUMENT_MIME_TYPES` enumerates what Documents accepts. Images and videos are excluded by construction, which satisfies #836 without giving up byte sniffing. Executables are excluded for the same reason, so no separate deny list is needed.
- `text/html`, `application/xhtml+xml`, and `image/svg+xml` are never allowed. `application/octet-stream` was dropped as a catch-all that defeats the point of the list.
- `application/xml` and `text/xml` stay, because `fileTypeFromBuffer` reports KML and GPX as `application/xml` and Payload validates the *detected* type. Removing them breaks geospatial uploads.
- `modifyDocumentResponseHeaders` sets `X-Content-Type-Options: nosniff` on every response and forces `Content-Disposition: attachment` for everything except PDF. This holds even for uploads that skipped the server-side checks.
- `assertFileContentMatchesName` (a `beforeOperation` hook) rejects HTML/SVG content under any filename and requires `%PDF-` for anything named `.pdf`, closing the fallback gap on paths that reach the server.
- The `@payloadcms/storage-vercel-blob` patch threads `allowedContentTypes` (mirrored from the collection's own `mimeTypes`) and `maximumSizeInBytes` onto the client-upload token, bounding the direct-to-blob path that hooks cannot reach.

## Consequences

- Adding a new document type means editing `DOCUMENT_MIME_TYPES`. That is the intended cost: the list is the thing keeping byte verification switched on.
- `allowedContentTypes` validates the browser-declared Content-Type, which a determined client controls. It is a guardrail against accidents, not a boundary against a malicious authenticated editor. The headers are what actually contain that case.
- PDFs remain `inline` so the Document block's embed layout keeps working. Any new inline-rendered type must be added to `INLINE_SAFE_MIME_TYPES` deliberately, with the first-party origin in mind.
- The patch cannot simply be deleted when Payload is upgraded. Upstream hardcodes `allowOverwrite: true` from 3.87.0, which makes that half redundant, but `allowedContentTypes` and `maximumSizeInBytes` do not exist upstream as of 3.88.0. On a bump, slim the patch rather than dropping it.
- `clientUploads` bypasses server-side file checks for `Media` too. That collection accepts images by design, so the exposure is different, but the same reasoning applies if its restrictions ever start mattering.
