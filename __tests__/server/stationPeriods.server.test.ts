import {
  customRangeBounds,
  formatRangeLabel,
  parseCustomRange,
  presetRange,
  STATION_PERIODS,
  stationSeasons,
  TABLE_CHUNK_DAYS,
  TABLE_MAX_CUSTOM_DAYS,
  tableChunk,
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
    expect(parseCustomRange('2026-01-01', '2026-04-02', 92, zone, now)).not.toBeNull()
    expect(parseCustomRange('2026-01-01', '2026-04-03', 92, zone, now)).toBeNull()
  })

  it('accepts a whole offered season', () => {
    expect(parse('2025-09-01', '2026-08-31')).toEqual({ from: '2025-09-01', to: '2026-08-31' })
  })

  it('rejects ranges that cross seasons or fall before the offered ones', () => {
    expect(parse('2026-08-15', '2026-09-15')).toBeNull()
    expect(parse('2025-08-15', '2025-08-20')).toBeNull()
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
  it('names the year once within a year', () => {
    expect(formatRangeLabel({ from: '2026-01-03', to: '2026-01-09' })).toBe('Jan 3 – Jan 9, 2026')
    expect(formatRangeLabel({ from: '2026-01-03', to: '2026-01-03' })).toBe('Jan 3, 2026')
  })

  it('names both years when the range crosses one', () => {
    expect(formatRangeLabel({ from: '2024-12-01', to: '2025-03-31' })).toBe(
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
})

describe('stationSeasons', () => {
  it('offers the current season and the one before', () => {
    expect(stationSeasons('2026-10-15')).toEqual([2027, 2026])
    expect(stationSeasons('2026-08-31')).toEqual([2026, 2025])
  })
})

describe('tableChunk', () => {
  const season = { from: '2025-09-01', to: '2026-08-31' }

  it('starts with the newest days and points at the next older ones', () => {
    const { chunk, next } = tableChunk(season, null)
    expect(chunk).toEqual({ from: '2026-08-02', to: '2026-08-31' })
    expect(next).toBe('2026-08-02')
  })

  it('picks up the day before `before`', () => {
    expect(tableChunk(season, '2026-08-02').chunk).toEqual({
      from: '2026-07-03',
      to: '2026-08-01',
    })
  })

  it('stops at the start of the range', () => {
    expect(tableChunk(season, '2025-09-10')).toEqual({
      chunk: { from: '2025-09-01', to: '2025-09-09' },
      next: null,
    })
  })

  it('covers every day of a range exactly once', () => {
    let before: string | null = null
    let days = 0
    do {
      const { chunk, next }: ReturnType<typeof tableChunk> = tableChunk(season, before)
      days += (new Date(chunk.to).getTime() - new Date(chunk.from).getTime()) / 86_400_000 + 1
      before = next
    } while (before)
    expect(days).toBe(365)
    expect(TABLE_CHUNK_DAYS).toBe(30)
  })
})
