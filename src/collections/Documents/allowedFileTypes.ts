/**
 * MIME types the Documents collection accepts.
 *
 * This is an allow list rather than a deny list on purpose. Payload only runs its
 * magic-byte check (`fileTypeFromBuffer`) when `upload.mimeTypes` is set; with the
 * list absent it falls back to comparing the filename extension and the
 * client-supplied mimetype against a small restricted list, which a rename defeats.
 * See docs/decisions/023-document-upload-restrictions.md for the full rationale.
 *
 * Images and videos are deliberately absent -- those belong in the Media collection.
 * `text/html`, `application/xhtml+xml` and `image/svg+xml` must never be added:
 * documents are served from the site's own origin, so markup here would execute
 * first-party.
 */
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',

  // KML and GPX are XML underneath, and Payload validates the *detected* type.
  // `fileTypeFromBuffer` reports both as application/xml, so the generic XML
  // types have to stay in the list or geospatial uploads break.
  'application/xml',
  'text/xml',
  'application/vnd.google-earth.kml+xml',
  '.kml',
  'application/gpx+xml',
  '.gpx',

  'text/plain',
  'text/csv',
  // JSON has no magic bytes, so Payload types it from the `.json` extension.
  'application/json',

  // Modern Office formats only. Legacy .doc/.xls/.ppt are detected as the generic
  // application/x-cfb container, which also covers .msi installers, and KMZ is
  // detected as a plain zip, so neither can be allowed without opening up much more.
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

/**
 * Types we are willing to render in the browser. Everything else is served as an
 * attachment so it cannot execute in the site's origin if its bytes turn out not
 * to match its declared type.
 */
export const INLINE_SAFE_MIME_TYPES = ['application/pdf']

export const isInlineSafeMimeType = (mimeType: string | null | undefined): boolean =>
  !!mimeType && INLINE_SAFE_MIME_TYPES.includes(mimeType)
