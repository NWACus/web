import {
  resolveTablePeriod,
  seasonHours,
  TABLE_PERIODS,
} from '../../src/components/WeatherStations/stationPeriods'
import { withElevationsIn } from '../../src/components/WeatherStations/stationTableUnits'
import { buildStationCsv } from '../../src/services/snowobs/csv'
import type { StationTable } from '../../src/services/snowobs/tableHelpers'
import type { SnowObsTimeseriesResponse } from '../../src/services/snowobs/types/schemas'
import {
  formatReading,
  parseStationUnits,
  roundTo,
  seriesDecimals,
} from '../../src/services/snowobs/units'

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
      decimals: 0,
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
      decimals: 0,
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
      decimals: 0,
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
  latestDisplay: null,
}

describe('withElevationsIn', () => {
  it('converts column elevations, always feet from SnowObs, and leaves readings alone', () => {
    const metric = withElevationsIn(table, 'metric')
    expect(metric.columns[0].elevation).toBe(1600)
    expect(metric.rows).toBe(table.rows)
    expect(withElevationsIn(table, 'default').columns[0].elevation).toBe(5250)
  })
})

describe('parseStationUnits', () => {
  it('reads default and metric, with an absent or earlier imperial param as default', () => {
    expect(parseStationUnits(null)).toBe('default')
    expect(parseStationUnits('imperial')).toBe('default')
    expect(parseStationUnits('default')).toBe('default')
    expect(parseStationUnits('metric')).toBe('metric')
    expect(parseStationUnits('kelvin')).toBeNull()
  })
})

describe('seriesDecimals', () => {
  it("reads SnowObs's rounding off the values it sent", () => {
    expect(seriesDecimals([0, 0.03, null, 0.1])).toBe(2)
    expect(seriesDecimals([33, 33.1, 'x'])).toBe(1)
    expect(seriesDecimals([30, 31])).toBe(0)
    expect(seriesDecimals([])).toBe(0)
  })

  it('caps a float artifact rather than showing every digit', () => {
    expect(seriesDecimals([0.1 + 0.2])).toBe(4)
  })
})

describe('roundTo and formatReading', () => {
  it("holds a derived value to the readings' precision", () => {
    expect(roundTo(33.2333, 1)).toBe(33.2)
    expect(roundTo(0.1 + 0.2, 2)).toBe(0.3)
  })

  it('pads to the precision and reads a rounded-away negative as 0', () => {
    expect(formatReading(1.5, 2)).toBe('1.50')
    expect(formatReading(74.51, 0)).toBe('75')
    expect(formatReading(-0.4, 0)).toBe('0')
    expect(formatReading(-0.6, 0)).toBe('-1')
  })
})

describe('resolveTablePeriod', () => {
  it('resolves period keys and defaults to 24h', () => {
    expect(resolveTablePeriod('7d').key).toBe('7d')
    expect(resolveTablePeriod(undefined).key).toBe('24h')
    expect(resolveTablePeriod('nonsense').key).toBe('24h')
  })

  it('caps table periods at 30 days', () => {
    expect(TABLE_PERIODS.map((p) => p.key)).toEqual(['24h', '48h', '72h', '7d', '30d'])
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

describe('buildStationCsv', () => {
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

  it('writes readings and units as SnowObs sent them', () => {
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
