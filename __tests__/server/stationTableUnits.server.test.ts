import {
  resolveTablePeriod,
  seasonHours,
  TABLE_PERIODS,
} from '../../src/components/WeatherStations/stationPeriods'
import {
  convertStationTable,
  formatStationValue,
} from '../../src/components/WeatherStations/stationTableUnits'
import { buildStationCsv } from '../../src/services/snowobs/csv'
import type { StationTable } from '../../src/services/snowobs/tableHelpers'
import type { SnowObsTimeseriesResponse } from '../../src/services/snowobs/types/schemas'

const table: StationTable = {
  columns: [
    {
      key: 'nwac:4_air_temp',
      stid: '4',
      source: 'nwac',
      variable: 'air_temp',
      label: 'Temp',
      longName: 'Air Temperature',
      unit: '°F',
      elevation: 5250,
    },
    {
      key: 'nwac:4_precip_accum_one_hour',
      stid: '4',
      source: 'nwac',
      variable: 'precip_accum_one_hour',
      label: 'Pcp1',
      longName: 'Precipitation',
      unit: 'in',
      elevation: 5250,
    },
    {
      key: 'nwac:4_relative_humidity',
      stid: '4',
      source: 'nwac',
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
        'nwac:4_air_temp': 32,
        'nwac:4_precip_accum_one_hour': 1,
        'nwac:4_relative_humidity': 80,
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
      'nwac:4_air_temp': 0,
      'nwac:4_precip_accum_one_hour': 25.4,
      'nwac:4_relative_humidity': 80,
    })
  })

  it('leaves imperial values unrounded and unconverted', () => {
    const raw = {
      ...table,
      rows: [{ ...table.rows[0], values: { ...table.rows[0].values, 'nwac:4_air_temp': 29.33 } }],
    }
    const imperial = convertStationTable(raw, 'imperial')
    expect(imperial.columns.map((c) => c.unit)).toEqual(['°F', 'in', '%'])
    expect(imperial.columns[0].elevation).toBe(5250)
    expect(imperial.rows[0].values['nwac:4_air_temp']).toBe(29.33)
  })
})

describe('formatStationValue', () => {
  it('reads precipitation to hundredths and the snow fields to tenths', () => {
    expect(formatStationValue('precip_accum_one_hour', 0.034, 'imperial')).toBe('0.03')
    expect(formatStationValue('precip_cumsum', 1.5, 'imperial')).toBe('1.50')
    expect(formatStationValue('snow_depth', 74.51, 'imperial')).toBe('74.5')
    expect(formatStationValue('snow_depth_24h', 2.46, 'imperial')).toBe('2.5')
    expect(formatStationValue('intermittent_snow', 1, 'imperial')).toBe('1.0')
  })

  it('rounds everything else to whole numbers', () => {
    expect(formatStationValue('air_temp', 31.4, 'imperial')).toBe('31')
    expect(formatStationValue('relative_humidity', 95.6, 'imperial')).toBe('96')
    expect(formatStationValue('wind_gust', 13.7, 'imperial')).toBe('14')
  })

  it('drops precipitation to one decimal in metric, where 0.01in is noise', () => {
    expect(formatStationValue('precip_accum_one_hour', 0.762, 'metric')).toBe('0.8')
    expect(formatStationValue('snow_depth', 189.23, 'metric')).toBe('189.2')
    expect(formatStationValue('air_temp', -0.6, 'metric')).toBe('-1')
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

describe('seasonHours', () => {
  it('anchors on the most recent Oct 1 in the given zone', () => {
    // 05:00 UTC on Oct 1 is still Sep 30 in Pacific, so its season began a year earlier.
    const justAfterUtcMidnight = new Date('2026-10-01T05:00:00Z')
    expect(seasonHours(justAfterUtcMidnight, 'America/Los_Angeles')).toBeGreaterThan(8000)
    expect(seasonHours(justAfterUtcMidnight, 'Pacific/Honolulu')).toBeGreaterThan(8000)
  })

  it('measures from the zone-local Oct 1 midnight', () => {
    const midSeason = new Date('2026-12-01T20:00:00Z')
    const pacific = seasonHours(midSeason, 'America/Los_Angeles')
    const mountain = seasonHours(midSeason, 'America/Denver')
    // Mountain reaches Oct 1 midnight an hour before Pacific does, so its season is an hour longer.
    expect(mountain - pacific).toBe(1)
  })

  it('never reports less than a day', () => {
    expect(seasonHours(new Date('2026-10-01T08:30:00Z'), 'America/Los_Angeles')).toBe(24)
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
        source: 'nwac',
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
    const [header, row] = buildStationCsv(
      'nwac',
      response,
      { stid: '4', source: 'nwac' },
      'metric',
    ).split('\n')
    expect(header).toBe('Time (PST),air_temp (°C),snow_depth (cm)')
    expect(row.endsWith(',0,25.4')).toBe(true)
  })

  it('keeps imperial output unchanged by default', () => {
    const [header, row] = buildStationCsv('nwac', response, { stid: '4', source: 'nwac' }).split(
      '\n',
    )
    expect(header).toBe('Time (PST),air_temp (°F),snow_depth (in)')
    expect(row.endsWith(',32,10')).toBe(true)
  })

  it("labels and stamps rows in the center's own timezone", () => {
    const [header, row] = buildStationCsv('btac', response, { stid: '4', source: 'nwac' }).split(
      '\n',
    )
    expect(header).toBe('Time (MST),air_temp (°F),snow_depth (in)')
    // Midnight UTC is 17:00 the previous day in Mountain, 16:00 in Pacific.
    expect(row.startsWith('2026-01-06 17:00')).toBe(true)
  })
})
