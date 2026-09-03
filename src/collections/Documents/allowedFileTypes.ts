/**
 * MIME types the Documents collection accepts.
 *
 * This is an allow list rather than a deny list on purpose. Payload only runs its
 * magic-byte check (`fileTypeFromBuffer`) when `upload.mimeTypes` is set; with the
 * list absent it falls back to comparing the filename extension and the
 * client-supplied mimetype against a small restricted list, which a rename defeats.
 * See docs/decisions/017-document-upload-restrictions.md for the full rationale.
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
  'application/vnd.google-earth.kmz',
  '.kmz',
  'application/gpx+xml',
  '.gpx',

  'text/plain',
  'text/csv',

  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

/**
 * Types we are willing to render in the browser. Everything else is served as an
 * attachment so it cannot execute in the site's origin if its bytes turn out not
 * to match its declared type.
 */
export const INLINE_SAFE_MIME_TYPES = ['application/pdf']
