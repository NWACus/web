import { INLINE_SAFE_MIME_TYPES } from './allowedFileTypes'

/**
 * Documents are served from the site's own origin, not from an isolated asset
 * domain, so a file whose bytes contradict its declared type could otherwise be
 * sniffed and rendered first-party.
 *
 * `nosniff` pins the declared type, and anything we are not deliberately
 * displaying is sent as an attachment so the browser downloads it rather than
 * rendering it. Together these hold even for uploads that skipped the
 * server-side checks entirely, which direct-to-blob client uploads do.
 */
export const modifyDocumentResponseHeaders = ({ headers }: { headers: Headers }): Headers => {
  headers.set('X-Content-Type-Options', 'nosniff')

  const contentType = headers.get('Content-Type')?.split(';')[0].trim()

  if (!contentType || !INLINE_SAFE_MIME_TYPES.includes(contentType)) {
    const disposition = headers.get('Content-Disposition')

    headers.set(
      'Content-Disposition',
      // Keep the filename the storage layer already resolved and swap only the
      // disposition type, so downloads keep their original names.
      disposition ? disposition.replace(/^\s*inline/i, 'attachment') : 'attachment',
    )
  }

  return headers
}
