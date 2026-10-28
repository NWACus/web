import { modifyMediaResponseHeaders } from '../../src/collections/Media/modifyMediaResponseHeaders'

describe('modifyMediaResponseHeaders', () => {
  // Mirrors the Vercel Blob handler, which appends its own year-long Cache-Control
  const blobHandlerHeaders = () => {
    const headers = new Headers()
    headers.append('Cache-Control', 'public, max-age=31536000')
    headers.append('Content-Type', 'image/webp')
    headers.append('ETag', '"prod/nwac-photo.webp-2026-01-01T00:00:00.000Z"')
    return headers
  }

  it("replaces the handler's browser max-age with a day", () => {
    const headers = modifyMediaResponseHeaders({ headers: blobHandlerHeaders() })

    expect(headers.get('Cache-Control')).toBe('public, max-age=86400')
  })

  it('keeps a year at the Vercel CDN', () => {
    const headers = modifyMediaResponseHeaders({ headers: blobHandlerHeaders() })

    expect(headers.get('Vercel-CDN-Cache-Control')).toBe('public, max-age=31536000')
  })

  it('leaves the ETag and content type alone so browser rechecks stay cheap', () => {
    const headers = modifyMediaResponseHeaders({ headers: blobHandlerHeaders() })

    expect(headers.get('ETag')).toBe('"prod/nwac-photo.webp-2026-01-01T00:00:00.000Z"')
    expect(headers.get('Content-Type')).toBe('image/webp')
  })
})
