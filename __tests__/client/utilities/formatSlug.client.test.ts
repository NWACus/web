import { composeSlug, formatDateForSlug, formatSlug, slugOf } from '@/fields/slug/formatSlug'

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

  it('collapses the hyphen runs left behind by stripped punctuation', () => {
    expect(formatSlug('Level 1 + Rescue Combined')).toBe('level-1-rescue-combined')
    expect(formatSlug('Recreational Level 1 – Ski & Splitboard')).toBe(
      'recreational-level-1-ski-splitboard',
    )
  })

  it('turns underscores into hyphens so the slug passes validation', () => {
    expect(formatSlug('Rec_1 Splitboard')).toBe('rec-1-splitboard')
  })

  it('trims hyphens left at either end', () => {
    expect(formatSlug('& Friends +')).toBe('friends')
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

describe('composeSlug', () => {
  it('joins prefix, base and date, skipping empty parts', () => {
    expect(composeSlug({ prefix: 'asi', base: 'rec-1', date: '2026-01-10' })).toBe(
      'asi-rec-1-2026-01-10',
    )
    expect(composeSlug({ prefix: '', base: 'rec-1', date: '2026-01-10' })).toBe('rec-1-2026-01-10')
  })

  it('generates nothing without a base', () => {
    expect(composeSlug({ prefix: 'asi', base: '', date: '2026-01-10' })).toBe('')
  })
})

describe('slugOf', () => {
  it('reads a string slug off a document', () => {
    expect(slugOf({ id: 1, slug: 'asi' })).toBe('asi')
  })

  it('returns an empty string when there is no string slug', () => {
    expect(slugOf(null)).toBe('')
    expect(slugOf({ id: 1 })).toBe('')
    expect(slugOf({ slug: 7 })).toBe('')
  })
})
