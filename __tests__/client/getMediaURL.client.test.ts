import { getMediaURL } from '@/utilities/getURL'

describe('client-side utilities: getMediaURL', () => {
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

  it('prepends base URL to relative URL', () => {
    const relativeUrl = '/images/photo.jpg'
    const result = getMediaURL(relativeUrl)
    const expectedUrl = `${window.location.origin}${relativeUrl}`
    expect(result).toBe(expectedUrl)
  })

  it('appends cache tag to relative URL when provided', () => {
    const relativeUrl = '/images/photo.jpg'
    const cacheTag = 'v456'
    const result = getMediaURL(relativeUrl, cacheTag)
    const expectedUrl = `${window.location.origin}${relativeUrl}?${cacheTag}`
    expect(result).toBe(expectedUrl)
  })

  it('ignores provided hostname on client side and uses window.location', () => {
    const relativeUrl = '/images/photo.jpg'
    const hostname = 'custom.localhost'
    const result = getMediaURL(relativeUrl, null, hostname)
    const expectedUrl = `${window.location.origin}${relativeUrl}`
    expect(result).toBe(expectedUrl)
  })

  it('handles URLs with query parameters correctly', () => {
    const relativeUrl = '/images/photo.jpg?existing=param'
    const cacheTag = 'v789'
    const result = getMediaURL(relativeUrl, cacheTag)
    const expectedUrl = `${window.location.origin}${relativeUrl}?${cacheTag}`
    expect(result).toBe(expectedUrl)
  })
})
