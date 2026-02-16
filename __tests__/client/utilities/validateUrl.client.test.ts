// Mock payload/shared which uses ESM and can't be parsed by Jest
jest.mock('payload/shared', () => ({ text: jest.fn(() => true) }))

import { isValidFullUrl } from '@/utilities/validateUrl'

describe('isValidFullUrl', () => {
  it('accepts a valid https URL', () => {
    expect(isValidFullUrl('https://example.com')).toBe(true)
  })

  it('accepts a valid http URL', () => {
    expect(isValidFullUrl('http://example.com')).toBe(true)
  })

  it('accepts a URL with a path', () => {
    expect(isValidFullUrl('https://example.com/path/to/page')).toBe(true)
  })

  it('accepts a URL with a subdomain', () => {
    expect(isValidFullUrl('https://www.example.com')).toBe(true)
  })

  it('accepts a URL with query parameters', () => {
    expect(isValidFullUrl('https://example.com?foo=bar')).toBe(true)
  })

  it('accepts a URL with .org TLD', () => {
    expect(isValidFullUrl('https://example.org')).toBe(true)
  })

  it('accepts a URL with .museum TLD', () => {
    expect(isValidFullUrl('https://example.museum')).toBe(true)
  })

  it('rejects null', () => {
    expect(isValidFullUrl(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isValidFullUrl(undefined)).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidFullUrl('')).toBe(false)
  })

  it('rejects whitespace-only string', () => {
    expect(isValidFullUrl('   ')).toBe(false)
  })

  it('rejects ftp protocol', () => {
    expect(isValidFullUrl('ftp://example.com')).toBe(false)
  })

  it('rejects mailto URLs', () => {
    expect(isValidFullUrl('mailto:test@example.com')).toBe(false)
  })

  it('rejects a bare domain without protocol', () => {
    expect(isValidFullUrl('example.com')).toBe(false)
  })

  it('rejects a URL with no TLD', () => {
    expect(isValidFullUrl('https://localhost')).toBe(false)
  })

  it('rejects a URL with a numeric TLD', () => {
    expect(isValidFullUrl('https://example.123')).toBe(false)
  })
})
