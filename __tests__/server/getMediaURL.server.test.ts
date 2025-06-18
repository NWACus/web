import { getMediaURL } from '@/utilities/getURL'

describe('server-side utilities: getMediaURL', () => {
  it('returns empty string for null or undefined URL', () => {
    expect(getMediaURL(null)).toBe('')
    expect(getMediaURL(undefined)).toBe('')
  })

  it('returns absolute URL unchanged when URL is absolute', () => {
    const absoluteUrl = 'https://example.com/image.jpg'
    const result = getMediaURL(absoluteUrl)
    expect(result).toBe(absoluteUrl)
  })

  it('appends cache tag to absolute URL when provided', () => {
    const absoluteUrl = 'https://example.com/image.jpg'
    const cacheTag = 'v123'
    const result = getMediaURL(absoluteUrl, cacheTag)
    expect(result).toBe('https://example.com/image.jpg?v123')
  })

  it('prepends base URL to relative URL using NEXT_PUBLIC_ROOT_DOMAIN env var', () => {
    const relativeUrl = '/images/photo.jpg'
    const result = getMediaURL(relativeUrl)
    expect(result).toBe('http://envvar.localhost:3000/images/photo.jpg')
  })

  it('appends cache tag to relative URL when provided', () => {
    const relativeUrl = '/images/photo.jpg'
    const cacheTag = 'v456'
    const result = getMediaURL(relativeUrl, cacheTag)
    expect(result).toBe('http://envvar.localhost:3000/images/photo.jpg?v456')
  })

  it('uses provided hostname for relative URLs when specified', () => {
    const relativeUrl = '/images/photo.jpg'
    const hostname = 'customhostname.com'
    const result = getMediaURL(relativeUrl, null, hostname)
    expect(result).toBe('http://customhostname.com/images/photo.jpg')
  })

  it('handles URLs with query parameters correctly', () => {
    const relativeUrl = '/images/photo.jpg?existing=param'
    const cacheTag = 'v789'
    const result = getMediaURL(relativeUrl, cacheTag)
    expect(result).toBe('http://envvar.localhost:3000/images/photo.jpg?existing=param?v789')
  })

  it('handles ftp protocol URLs as absolute', () => {
    const ftpUrl = 'ftp://example.com/file.txt'
    const result = getMediaURL(ftpUrl)
    expect(result).toBe(ftpUrl)
  })

  it('handles data URLs as absolute', () => {
    const dataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const result = getMediaURL(dataUrl)
    expect(result).toBe(dataUrl)
  })
})
