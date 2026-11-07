import { mergeTables } from '../../src/components/WeatherStations/stationTableMerge'
import type { StationTable, TableColumn } from '../../src/services/snowobs/tableHelpers'

const column = (key: string): TableColumn => ({
  key,
  stid: '1',
  source: 'nwac',
  variable: key,
  label: key,
  longName: key,
  unit: '',
  decimals: 0,
  elevation: null,
})

const table = (keys: string[], hours: number[]): StationTable => ({
  columns: keys.map(column),
  rows: hours.map((timestamp) => ({ timestamp, display: String(timestamp), values: {} })),
  timezoneLabel: 'PST',
  latestObservation: null,
  latestDisplay: null,
})

const keysOf = (shown: StationTable) => shown.columns.map((c) => c.key)

describe('mergeTables', () => {
  it('names the zone without standard or daylight when chunks span a clock change', () => {
    const older = { ...table(['a'], [1]), timezoneLabel: 'PDT' }
    const merged = mergeTables({ default: table(['a'], [2]), metric: null }, [
      { default: older, metric: null },
    ])
    expect(merged.default.timezoneLabel).toBe('PT')
  })

  it('adds older rows after the shown ones, once each', () => {
    const merged = mergeTables({ default: table(['a'], [3, 2]), metric: null }, [
      { default: table(['a'], [2, 1]), metric: null },
    ])
    expect(merged.default.rows.map((r) => r.timestamp)).toEqual([3, 2, 1])
  })

  it('slots a new column after the one it follows in the older chunk', () => {
    const merged = mergeTables({ default: table(['temp', 'wind'], [2]), metric: null }, [
      { default: table(['temp', 'snow_depth', 'wind'], [1]), metric: null },
    ])
    expect(keysOf(merged.default)).toEqual(['temp', 'snow_depth', 'wind'])
  })

  it('puts a new first column first', () => {
    const merged = mergeTables({ default: table(['temp'], [2]), metric: null }, [
      { default: table(['snow_depth', 'temp'], [1]), metric: null },
    ])
    expect(keysOf(merged.default)).toEqual(['snow_depth', 'temp'])
  })

  it('merges metric alongside, and drops it if a chunk has none', () => {
    const both = { default: table(['a'], [2]), metric: table(['a'], [2]) }
    const withMetric = { default: table(['a'], [1]), metric: table(['a'], [1]) }
    expect(mergeTables(both, [withMetric]).metric?.rows).toHaveLength(2)
    expect(mergeTables(both, [{ default: table(['a'], [1]), metric: null }]).metric).toBeNull()
  })
})
