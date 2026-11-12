import {
  defaultInterval,
  MAX_RANGE_DAYS,
  presetBaseline,
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
  })

  it('builds season presets from September 1, turning over in the center timezone', () => {
    const now = new Date('2026-11-09T20:00:00Z')
    expect(presetRange('seasonToDate', PACIFIC, now)).toEqual({
      from: '2026-09-01',
      to: '2026-11-09',
    })
    expect(presetRange('lastSeason', PACIFIC, now)).toEqual({
      from: '2025-09-01',
      to: '2026-08-31',
    })
    // Still August 31 in Pacific time, so the 2025–26 season is the current one
    const turnover = new Date('2026-09-01T03:00:00Z')
    expect(presetRange('seasonToDate', PACIFIC, turnover)).toEqual({
      from: '2025-09-01',
      to: '2026-08-31',
    })
    expect(presetRange('lastSeason', PACIFIC, turnover)).toEqual({
      from: '2024-09-01',
      to: '2025-08-31',
    })
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
    expect(resolved.previousEnd.toISOString()).toBe(resolved.start.toISOString())
    expect(resolved.baseline).toBe('preceding')
    expect(resolved.bucket).toBe('day')
    expect(resolved.ongoing).toBe(true)
  })

  it('compares a season with the same dates a year earlier', () => {
    const now = new Date('2026-11-12T20:10:00Z')
    const resolved = resolveRange(
      presetRange('seasonToDate', PACIFIC, now),
      PACIFIC,
      now,
      null,
      presetBaseline('seasonToDate'),
    )
    if ('error' in resolved) throw new Error(resolved.error)
    expect(resolved.baseline).toBe('yearEarlier')
    expect(resolved.previousFrom).toBe('2025-09-01')
    expect(resolved.previousTo).toBe('2025-11-12')
    expect(resolved.previousStart.toISOString()).toBe('2025-09-01T07:00:00.000Z')
    // The end of Nov 12, 2025, after the clocks went back
    expect(resolved.previousEnd.toISOString()).toBe('2025-11-13T08:00:00.000Z')
  })

  it('maps February 29 to February 28 a year earlier', () => {
    const resolved = resolveRange(
      { from: '2027-09-01', to: '2028-02-29' },
      PACIFIC,
      new Date('2028-03-10T20:00:00Z'),
      null,
      'yearEarlier',
    )
    if ('error' in resolved) throw new Error(resolved.error)
    expect([resolved.previousFrom, resolved.previousTo]).toEqual(['2026-09-01', '2027-02-28'])
  })

  it('uses the year-earlier baseline only for season presets', () => {
    expect(presetBaseline('seasonToDate')).toBe('yearEarlier')
    expect(presetBaseline('lastSeason')).toBe('yearEarlier')
    expect(presetBaseline('30d')).toBe('preceding')
    expect(presetBaseline('custom')).toBe('preceding')
  })

  it('rejects an unknown baseline', () => {
    const range = { from: '2026-11-02', to: '2026-11-09' }
    expect(resolveRange(range, PACIFIC, new Date(), null, 'nope')).toEqual({
      error: 'Unknown comparison baseline',
    })
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
