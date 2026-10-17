import {
  customRangeBounds,
  formatRangeLabel,
  parseCustomRange,
  presetRange,
  STATION_PERIODS,
  TABLE_MAX_CUSTOM_DAYS,
} from '../../src/components/WeatherStations/stationPeriods'

const zone = 'America/Los_Angeles'
const now = new Date('2026-10-15T19:00:00Z')

describe('parseCustomRange', () => {
  const parse = (from?: string, to?: string) =>
    parseCustomRange(from, to, TABLE_MAX_CUSTOM_DAYS, zone, now)

  it('accepts an ordered past range, including a single day', () => {
    expect(parse('2026-01-03', '2026-01-09')).toEqual({ from: '2026-01-03', to: '2026-01-09' })
    expect(parse('2026-10-15', '2026-10-15')).toEqual({ from: '2026-10-15', to: '2026-10-15' })
  })

  it('rejects missing, malformed and impossible dates', () => {
    expect(parse(undefined, '2026-01-09')).toBeNull()
    expect(parse('2026-1-3', '2026-01-09')).toBeNull()
    expect(parse('2026-02-31', '2026-03-02')).toBeNull()
  })

  it('rejects reversed, future and over-long ranges', () => {
    expect(parse('2026-01-09', '2026-01-03')).toBeNull()
    expect(parse('2026-10-15', '2026-10-16')).toBeNull()
    expect(parse('2026-01-01', '2026-04-02')).toEqual({ from: '2026-01-01', to: '2026-04-02' })
    expect(parse('2026-01-01', '2026-04-03')).toBeNull()
  })

  it('judges "today" in the center zone, not UTC', () => {
    // 03:00 UTC on the 16th is still the 15th in Seattle.
    const lateEvening = new Date('2026-10-16T03:00:00Z')
    expect(parseCustomRange('2026-10-16', '2026-10-16', 92, zone, lateEvening)).toBeNull()
  })
})

describe('customRangeBounds', () => {
  it('runs from local midnight to 23:59 on the last day', () => {
    expect(customRangeBounds({ from: '2026-03-07', to: '2026-03-08' }, zone, now)).toEqual({
      from: new Date('2026-03-07T08:00:00Z'),
      // DST starts on the 8th, so the day ends at 07:00 UTC.
      to: new Date('2026-03-09T06:59:00Z'),
    })
  })

  it('leaves the end open when the range reaches today', () => {
    expect(customRangeBounds({ from: '2026-10-10', to: '2026-10-15' }, zone, now).to).toBeNull()
  })
})

describe('formatRangeLabel', () => {
  it('omits the year within the current year', () => {
    expect(formatRangeLabel({ from: '2026-01-03', to: '2026-01-09' }, now, zone)).toBe(
      'Jan 3 – Jan 9',
    )
    expect(formatRangeLabel({ from: '2026-01-03', to: '2026-01-03' }, now, zone)).toBe('Jan 3')
  })

  it('shows years when the range leaves the current year', () => {
    expect(formatRangeLabel({ from: '2024-12-01', to: '2025-03-31' }, now, zone)).toBe(
      'Dec 1, 2024 – Mar 31, 2025',
    )
  })
})

describe('presetRange', () => {
  it('labels a rolling preset by the days it covers', () => {
    expect(presetRange(STATION_PERIODS[0], zone, now)).toEqual({
      from: '2026-10-14',
      to: '2026-10-15',
    })
  })

  it('starts the season on Oct 1 despite rounding up to whole hours', () => {
    const season = STATION_PERIODS.find((p) => p.key === 'season')
    expect(season && presetRange(season, zone, now).from).toBe('2026-10-01')
  })
})
