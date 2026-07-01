import { formatDateForSlug, formatSlug } from '@/fields/slug/formatSlug'

describe('formatSlug', () => {
  it('kebab-cases a multi-word string', () => {
    expect(formatSlug('REI Awareness Class')).toBe('rei-awareness-class')
  })

  it('strips characters that are not letters, numbers, or hyphens', () => {
    expect(formatSlug("Backcountry Essentials Women's")).toBe('backcountry-essentials-womens')
  })

  it('trims surrounding whitespace', () => {
    expect(formatSlug('  Hello World  ')).toBe('hello-world')
  })

  it('leaves an already-kebab slug intact', () => {
    expect(formatSlug('already-kebab-123')).toBe('already-kebab-123')
  })

  it('returns an empty string for null or empty input', () => {
    expect(formatSlug(null)).toBe('')
    expect(formatSlug('')).toBe('')
  })
})

describe('formatDateForSlug', () => {
  it('formats an ISO datetime string as YYYY-MM-DD (UTC)', () => {
    expect(formatDateForSlug('2025-11-13T18:00:00.000Z')).toBe('2025-11-13')
  })

  it('formats a date-only string', () => {
    expect(formatDateForSlug('2025-11-13')).toBe('2025-11-13')
  })

  it('formats a Date object', () => {
    expect(formatDateForSlug(new Date(Date.UTC(2025, 10, 13)))).toBe('2025-11-13')
  })

  it('returns an empty string for an invalid date string', () => {
    expect(formatDateForSlug('not-a-date')).toBe('')
  })

  it('returns an empty string for non-string, non-Date values', () => {
    expect(formatDateForSlug(undefined)).toBe('')
    expect(formatDateForSlug(null)).toBe('')
    expect(formatDateForSlug(1731513600000)).toBe('')
  })
})
