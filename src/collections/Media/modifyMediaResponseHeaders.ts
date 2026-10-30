// Pins the CDN's year so it no longer rides on the Blob adapter's browser max-age default.
export const modifyMediaResponseHeaders = ({ headers }: { headers: Headers }): Headers => {
  headers.set('Vercel-CDN-Cache-Control', 'public, max-age=31536000')

  return headers
}
