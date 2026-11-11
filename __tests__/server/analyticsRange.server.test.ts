import {
  defaultInterval,
  MAX_RANGE_DAYS,
  presetRange,
  rangeDays,
  resolveRange,
  todayIn,
  trendIntervals,
  zonedDayStart,
} from '@/services/posthog/analyticsRange'

const PACIFIC = 'America/Los_Angeles'

describe('analyticsRange', () => {
  it('finds today in the center timezone, not UTC', () => {
    // 03:30 UTC on Nov 10 is still Nov 9 in Seattle
    expect(todayIn(PACIFIC, new Date('2026-11-10T03:30:00Z'))).toBe('2026-11-09')
    expect(todayIn('UTC', new Date('2026-11-10T03:30:00Z'))).toBe('2026-11-10')
  })

  it('starts a day at local midnight, honouring DST', () => {
    const instant = (iso: string) => new Date(zonedDayStart(iso, PACIFIC).getTime()).toISOString()
    expect(instant('2026-11-09')).toBe('2026-11-09T08:00:00.000Z')
    expect(instant('2026-10-15')).toBe('2026-10-15T07:00:00.000Z')
  })

  it('builds preset ranges ending today', () => {
    const now = new Date('2026-11-09T20:00:00Z')
    expect(presetRange('7d', PACIFIC, now)).toEqual({ from: '2026-11-02', to: '2026-11-09' })
    expect(presetRange('30d', PACIFIC, now)).toEqual({ from: '2026-10-10', to: '2026-11-09' })
    expect(presetRange('12m', PACIFIC, now)).toEqual({ from: '2025-11-09', to: '2026-11-09' })
  })

  it('resolves a range to instants with a same-length previous period', () => {
    const resolved = resolveRange(
      { from: '2026-11-02', to: '2026-11-09' },
      PACIFIC,
      new Date('2026-11-09T20:10:00Z'),
    )
    if ('error' in resolved) throw new Error(resolved.error)

    expect(resolved.start.toISOString()).toBe('2026-11-02T08:00:00.000Z')
    // The range runs to now, rounded up to the hour so the SQL text is stable
    expect(resolved.end.toISOString()).toBe('2026-11-09T21:00:00.000Z')
    expect(resolved.previousFrom).toBe('2026-10-25')
    expect(resolved.previousTo).toBe('2026-11-01')
    expect(resolved.previousStart.toISOString()).toBe('2026-10-25T07:00:00.000Z')
    expect(resolved.bucket).toBe('day')
    expect(resolved.ongoing).toBe(true)
  })

  it('ends a past range at the day after `to`', () => {
    const resolved = resolveRange(
      { from: '2026-10-01', to: '2026-10-07' },
      PACIFIC,
      new Date('2026-11-09T20:10:00Z'),
    )
    if ('error' in resolved) throw new Error(resolved.error)
    expect(resolved.end.toISOString()).toBe('2026-10-08T07:00:00.000Z')
    expect(resolved.ongoing).toBe(false)
  })

  it('offers weeks past two weeks and months past 92 days, defaulting to weeks there', () => {
    expect(trendIntervals(8)).toEqual(['day'])
    expect(trendIntervals(31)).toEqual(['day', 'week'])
    expect(trendIntervals(91)).toEqual(['day', 'week'])
    expect(trendIntervals(366)).toEqual(['day', 'week', 'month'])
    expect(defaultInterval(91)).toBe('day')
    expect(defaultInterval(366)).toBe('week')
  })

  it('takes an allowed grouping and refuses one the range is too short for', () => {
    const now = new Date('2026-11-09T20:10:00Z')
    const year = resolveRange({ from: '2025-11-09', to: '2026-11-09' }, PACIFIC, now, 'month')
    expect('error' in year ? year.error : year.bucket).toBe('month')
    expect(resolveRange({ from: '2026-11-01', to: '2026-11-09' }, PACIFIC, now, 'week')).toEqual({
      error: "This range can't be grouped by week",
    })
  })

  it('counts inclusive days and enforces the cap', () => {
    expect(rangeDays({ from: '2026-11-01', to: '2026-11-01' })).toBe(1)
    expect(rangeDays({ from: '2025-11-09', to: '2026-11-09' })).toBe(366)
    const now = new Date('2026-11-09T20:10:00Z')
    const year = resolveRange({ from: '2025-11-09', to: '2026-11-09' }, PACIFIC, now)
    expect('error' in year ? year.error : year.bucket).toBe('week')
    expect(resolveRange({ from: '2025-11-08', to: '2026-11-09' }, PACIFIC, now)).toEqual({
      error: `Ranges are limited to ${MAX_RANGE_DAYS} days`,
    })
  })

  it('rejects bad input', () => {
    expect(resolveRange({ from: '2026-11-09', to: '2026-11-01' }, PACIFIC, new Date())).toEqual({
      error: 'The start date must not be after the end date',
    })
    expect(resolveRange({ from: 'nope', to: '2026-11-01' }, PACIFIC, new Date())).toHaveProperty(
      'error',
    )
  })
})
