/**
 * The Blob handler already sends `max-age` of a year, which also pins every
 * browser to a deleted or same-name re-uploaded file for a year with no way to
 * purge it. The CDN keeps the year; browsers recheck daily against the ETag.
 * Payload only calls this on successful responses, so 404s and failed Blob
 * fetches stay uncached.
 */
export const modifyMediaResponseHeaders = ({ headers }: { headers: Headers }): Headers => {
  headers.set('Cache-Control', 'public, max-age=86400')
  headers.set('Vercel-CDN-Cache-Control', 'public, max-age=31536000')

  return headers
}
