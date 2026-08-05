import {
  resolveTablePeriod,
  TABLE_PERIODS,
} from '../../src/components/WeatherStations/stationPeriods'
import { convertStationTable } from '../../src/components/WeatherStations/stationTableUnits'
import { buildStationCsv } from '../../src/services/snowobs/csv'
import type { StationTable } from '../../src/services/snowobs/tableHelpers'
import type { SnowObsTimeseriesResponse } from '../../src/services/snowobs/types/schemas'

const table: StationTable = {
  columns: [
    {
      key: '4_air_temp',
      stid: '4',
      variable: 'air_temp',
      label: 'Temp',
      longName: 'Air Temperature',
      unit: '°F',
      elevation: 5250,
    },
    {
      key: '4_precip_accum_one_hour',
      stid: '4',
      variable: 'precip_accum_one_hour',
      label: 'Pcp1',
      longName: 'Precipitation',
      unit: 'in',
      elevation: 5250,
    },
    {
      key: '4_relative_humidity',
      stid: '4',
      variable: 'relative_humidity',
      label: 'RH',
      longName: 'Relative Humidity',
      unit: '%',
      elevation: 5250,
    },
  ],
  rows: [
    {
      timestamp: 1_700_000_000_000,
      display: '11/14 14:13',
      values: {
        '4_air_temp': 32,
        '4_precip_accum_one_hour': 1,
        '4_relative_humidity': 80,
      },
    },
  ],
  timezoneLabel: 'PST',
  latestObservation: 1_700_000_000_000,
}

describe('convertStationTable', () => {
  it('converts values, units, and elevation to metric', () => {
    const metric = convertStationTable(table, 'metric')
    expect(metric.columns.map((c) => c.unit)).toEqual(['°C', 'mm', '%'])
    expect(metric.columns[0].elevation).toBe(1600)
    expect(metric.rows[0].values).toEqual({
      '4_air_temp': 0,
      '4_precip_accum_one_hour': 25.4,
      '4_relative_humidity': 80,
    })
  })

  it('rounds imperial display values to one decimal without converting', () => {
    const raw = {
      ...table,
      rows: [{ ...table.rows[0], values: { ...table.rows[0].values, '4_air_temp': 29.33 } }],
    }
    const imperial = convertStationTable(raw, 'imperial')
    expect(imperial.columns.map((c) => c.unit)).toEqual(['°F', 'in', '%'])
    expect(imperial.columns[0].elevation).toBe(5250)
    expect(imperial.rows[0].values['4_air_temp']).toBe(29.3)
  })
})

describe('resolveTablePeriod', () => {
  it('resolves period keys and defaults to 24h', () => {
    expect(resolveTablePeriod('7d').key).toBe('7d')
    expect(resolveTablePeriod(undefined).key).toBe('24h')
    expect(resolveTablePeriod('nonsense').key).toBe('24h')
  })

  it('caps table periods at 30 days', () => {
    expect(TABLE_PERIODS.map((p) => p.key)).toEqual(['24h', '7d', '30d'])
  })
})

describe('buildStationCsv metric', () => {
  const response: SnowObsTimeseriesResponse = {
    UNITS: { air_temp: 'fahrenheit', snow_depth: 'inches' },
    VARIABLES: [
      { variable: 'air_temp', long_name: 'Air Temperature' },
      { variable: 'snow_depth', long_name: 'Snow Depth' },
    ],
    STATION: [
      {
        id: '4',
        stid: '4',
        name: 'Hurricane Ridge',
        latitude: null,
        longitude: null,
        elevation: 5250,
        observations: {
          date_time: ['2026-01-07T00:00:00Z'],
          air_temp: [32],
          snow_depth: [10],
        },
      },
    ],
  }

  it('converts header units and values when metric', () => {
    const [header, row] = buildStationCsv(response, '4', 'metric').split('\n')
    expect(header).toBe('Time (Pacific),air_temp (°C),snow_depth (cm)')
    expect(row.endsWith(',0,25.4')).toBe(true)
  })

  it('keeps imperial output unchanged by default', () => {
    const [header, row] = buildStationCsv(response, '4').split('\n')
    expect(header).toBe('Time (Pacific),air_temp (°F),snow_depth (in)')
    expect(row.endsWith(',32,10')).toBe(true)
  })
})
