import { getRelativeTime } from '@/utilities/getRelativeTime'

describe('getRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns "today" for the current date', () => {
    expect(getRelativeTime('2025-01-15T08:00:00Z')).toBe('today')
  })

  it('returns "yesterday" for one day ago', () => {
    expect(getRelativeTime('2025-01-14T12:00:00Z')).toBe('yesterday')
  })

  it('returns "X days ago" for 2-6 days ago', () => {
    expect(getRelativeTime('2025-01-12T12:00:00Z')).toBe('3 days ago')
  })

  it('returns "1 weeks ago" for 7 days ago', () => {
    expect(getRelativeTime('2025-01-08T12:00:00Z')).toBe('1 weeks ago')
  })

  it('returns "3 weeks ago" for 21 days ago', () => {
    expect(getRelativeTime('2024-12-25T12:00:00Z')).toBe('3 weeks ago')
  })

  it('returns "1 months ago" for 30+ days', () => {
    expect(getRelativeTime('2024-12-15T12:00:00Z')).toBe('1 months ago')
  })

  it('returns "1 years ago" for 365+ days', () => {
    expect(getRelativeTime('2024-01-10T12:00:00Z')).toBe('1 years ago')
  })
})
