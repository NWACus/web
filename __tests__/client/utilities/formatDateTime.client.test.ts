import { formatDateTime, splitDateTimeRange } from '@/utilities/formatDateTime'

const PACIFIC = 'America/Los_Angeles'

describe('formatDateTime', () => {
  it('formats the instant in the given timezone and appends its abbreviation for zzz', () => {
    expect(formatDateTime('2026-01-15T23:00:00Z', PACIFIC, 'MMM d, h:mm a zzz')).toBe(
      'Jan 15, 3:00 PM PST',
    )
  })

  it('uses the daylight abbreviation in summer', () => {
    expect(formatDateTime('2026-07-15T22:00:00Z', PACIFIC, 'h:mm a zzz')).toBe('3:00 PM PDT')
  })
})

describe('splitDateTimeRange', () => {
  const joined = (start: string, end: string) => {
    const range = splitDateTimeRange(start, end, PACIFIC)
    return `${range.start} - ${range.end}`
  }

  it('shows the date once for a same-day range', () => {
    expect(splitDateTimeRange('2026-01-15T23:00:00Z', '2026-01-16T01:00:00Z', PACIFIC)).toEqual({
      sameDay: true,
      start: 'Jan 15, 2026, 3:00 PM',
      end: '5:00 PM PST',
    })
  })

  it('drops the start year when a multi-day range stays within one year', () => {
    expect(splitDateTimeRange('2026-01-15T23:00:00Z', '2026-01-17T01:00:00Z', PACIFIC)).toEqual({
      sameDay: false,
      start: 'Jan 15, 3:00 PM',
      end: 'Jan 16, 2026, 5:00 PM PST',
    })
  })

  it('keeps both years when a range crosses a year boundary', () => {
    expect(joined('2025-12-31T23:00:00Z', '2026-01-02T01:00:00Z')).toBe(
      'Dec 31, 2025, 3:00 PM - Jan 1, 2026, 5:00 PM PST',
    )
  })

  it('decides same-day in the given timezone, not UTC', () => {
    // Both instants fall on Jan 16 in UTC, but 10pm-2am Pacific spans two days.
    expect(joined('2026-01-16T06:00:00Z', '2026-01-16T10:00:00Z')).toBe(
      'Jan 15, 10:00 PM - Jan 16, 2026, 2:00 AM PST',
    )
  })
})
