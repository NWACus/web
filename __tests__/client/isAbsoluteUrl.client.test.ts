import isAbsoluteUrl from '@/utilities/isAbsoluteUrl'

describe('isAbsoluteUrl', () => {
  it('returns true for https URL', () => {
    expect(isAbsoluteUrl('https://example.com')).toBe(true)
  })

  it('returns true for http URL', () => {
    expect(isAbsoluteUrl('http://example.com')).toBe(true)
  })

  it('returns true for URL with path', () => {
    expect(isAbsoluteUrl('https://example.com/path/to/page')).toBe(true)
  })

  it('returns false for relative path', () => {
    expect(isAbsoluteUrl('/images/photo.jpg')).toBe(false)
  })

  it('returns false for bare string', () => {
    expect(isAbsoluteUrl('not-a-url')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isAbsoluteUrl(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isAbsoluteUrl(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isAbsoluteUrl('')).toBe(false)
  })
})
