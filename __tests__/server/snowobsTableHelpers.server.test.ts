import { buildStationTable, computePrecipCumsum } from '../../src/services/snowobs/tableHelpers'
import type { SnowObsTimeseriesResponse } from '../../src/services/snowobs/types/schemas'

// Two stations with deliberately misaligned timestamps to exercise the full
// outer join, null passthrough, and cumulative-precip computation.
const T0 = '2026-07-07T00:00:00Z' // 07/06 17:00 PDT
const T1 = '2026-07-07T01:00:00Z' // 07/06 18:00 PDT
const T2 = '2026-07-07T02:00:00Z' // 07/06 19:00 PDT
const T3 = '2026-07-07T03:00:00Z' // 07/06 20:00 PDT

const response: SnowObsTimeseriesResponse = {
  UNITS: { air_temp: 'fahrenheit', precip_accum_one_hour: 'inches' },
  VARIABLES: [
    { variable: 'air_temp', long_name: 'Air Temperature' },
    { variable: 'precip_accum_one_hour', long_name: 'Precipitation' },
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
        date_time: [T0, T1, T2],
        air_temp: [60, null, 62],
        precip_accum_one_hour: [0.1, null, 0.2],
      },
    },
    {
      id: '5',
      stid: '5',
      source: 'nwac',
      name: 'Upper',
      latitude: null,
      longitude: null,
      elevation: 4200,
      observations: {
        date_time: [T1, T2, T3],
        air_temp: [40, 41, 42],
      },
    },
  ],
}

const ref = (stid: string) => ({ stid, source: 'nwac' })
const columnConfig = [
  { station: ref('4'), variable: 'air_temp' },
  { station: ref('4'), variable: 'precip_accum_one_hour' },
  { station: ref('5'), variable: 'air_temp' },
]

describe('computePrecipCumsum', () => {
  it('runs a cumulative total, passing nulls through without advancing the sum', () => {
    expect(computePrecipCumsum([0.1, 0.2, null, 0.3])).toEqual([0.1, 0.3, null, 0.6])
  })

  it('rounds to two decimals to avoid float drift', () => {
    expect(computePrecipCumsum([0.1, 0.2])).toEqual([0.1, 0.3])
  })

  it('handles an all-null series', () => {
    expect(computePrecipCumsum([null, null])).toEqual([null, null])
  })
})

describe('buildStationTable', () => {
  const table = buildStationTable('nwac', response, columnConfig)

  it('auto-inserts a cumulative-precip column after hourly precip, in config order', () => {
    expect(table.columns.map((c) => c.key)).toEqual([
      'nwac:4_air_temp',
      'nwac:4_precip_accum_one_hour',
      'nwac:4_precip_cumsum',
      'nwac:5_air_temp',
    ])
  })

  it('labels columns with short headers, long names, display units, and elevation', () => {
    const temp = table.columns.find((c) => c.key === 'nwac:4_air_temp')
    expect(temp).toMatchObject({
      label: 'Temp',
      longName: 'Air Temperature',
      unit: '°F',
      elevation: 5250,
    })
    const cumsum = table.columns.find((c) => c.key === 'nwac:4_precip_cumsum')
    expect(cumsum).toMatchObject({
      label: 'PcpSum',
      longName: 'Cumulative Precipitation',
      unit: 'in',
    })
  })

  it('produces newest-first rows across the union of all timestamps', () => {
    expect(table.rows.map((r) => r.display)).toEqual([
      '07/06 20:00',
      '07/06 19:00',
      '07/06 18:00',
      '07/06 17:00',
    ])
  })

  it('full-outer-joins stations, filling gaps with null', () => {
    const [newest, second, third, oldest] = table.rows
    // T3: only station 5 reports
    expect(newest.values).toMatchObject({ 'nwac:4_air_temp': null, 'nwac:5_air_temp': 42 })
    // T2: both report; cumulative precip = 0.1 + 0.2
    expect(second.values).toMatchObject({
      'nwac:4_air_temp': 62,
      'nwac:4_precip_accum_one_hour': 0.2,
      'nwac:4_precip_cumsum': 0.3,
      'nwac:5_air_temp': 41,
    })
    // T1: station 4 has a null reading; station 5 reports
    expect(third.values).toMatchObject({ 'nwac:4_air_temp': null, 'nwac:5_air_temp': 40 })
    // T0: only station 4 reports; cumulative precip starts at 0.1
    expect(oldest.values).toMatchObject({
      'nwac:4_air_temp': 60,
      'nwac:4_precip_cumsum': 0.1,
      'nwac:5_air_temp': null,
    })
  })

  it('reports the display timezone label and latest observation time', () => {
    expect(table.timezoneLabel).toBe('PDT')
    expect(table.latestObservation).toBe(new Date(T3).getTime())
  })

  it('reads the zone from the center, not a constant', () => {
    const mountain = buildStationTable('btac', response, columnConfig)
    expect(mountain.timezoneLabel).toBe('MDT')
    // Same instants, one hour later on a Mountain clock.
    expect(mountain.rows.map((r) => r.display)).not.toEqual(table.rows.map((r) => r.display))
    expect(mountain.latestObservation).toBe(table.latestObservation)
  })
})

describe('buildStationTable with stations on different schedules', () => {
  // A logger on the hour beside an airport reporting every few minutes, with a
  // rolling one-hour precip total.
  const mixed: SnowObsTimeseriesResponse = {
    UNITS: { air_temp: 'Fahrenheit', precip_accum_one_hour: 'Inches' },
    VARIABLES: [
      { variable: 'air_temp', long_name: 'Air Temperature' },
      { variable: 'precip_accum_one_hour', long_name: 'Precipitation (1 hr)' },
    ],
    STATION: [
      {
        id: '1',
        stid: '1',
        source: 'nwac',
        name: 'Logger',
        observations: {
          date_time: ['2026-07-07T01:00:00Z', '2026-07-07T02:00:00Z'],
          air_temp: [40, 41],
        },
      },
      {
        id: 'KSEA',
        stid: 'KSEA',
        source: 'mesowest',
        name: 'Airport',
        observations: {
          date_time: [
            '2026-07-07T00:55:00Z',
            '2026-07-07T01:45:00Z',
            '2026-07-07T01:53:00Z',
            '2026-07-07T01:58:00Z',
            '2026-07-07T02:10:00Z',
          ],
          air_temp: [60, 61, 62, null, 63],
          precip_accum_one_hour: [0.1, 0.2, 0.2, 0.2, 0.3],
        },
      },
    ],
  }
  const columns = [
    { station: { stid: '1', source: 'nwac' }, variable: 'air_temp' },
    { station: { stid: 'KSEA', source: 'mesowest' }, variable: 'air_temp' },
    { station: { stid: 'KSEA', source: 'mesowest' }, variable: 'precip_accum_one_hour' },
  ]
  // 02:20Z: the 02:10 reading belongs to the 03:00 row, which hasn't come yet.
  const now = Date.parse('2026-07-07T02:20:00Z')
  const table = buildStationTable('nwac', mixed, columns, now)

  it('gives one row per hour, dropping the hour still in progress', () => {
    expect(table.rows.map((r) => r.display)).toEqual(['07/06 19:00', '07/06 18:00'])
  })

  it("shows each station's latest non-null reading up to the row's hour", () => {
    const [two, one] = table.rows
    expect(two.values).toMatchObject({ 'nwac:1_air_temp': 41, 'mesowest:KSEA_air_temp': 62 })
    expect(one.values).toMatchObject({ 'nwac:1_air_temp': 40, 'mesowest:KSEA_air_temp': 60 })
  })

  it('totals precip over the hourly values, not every reading', () => {
    const [two, one] = table.rows
    expect(one.values['mesowest:KSEA_precip_cumsum']).toBe(0.1)
    expect(two.values['mesowest:KSEA_precip_cumsum']).toBe(0.3)
  })

  it('reports the newest reading at its own time', () => {
    expect(table.latestObservation).toBe(Date.parse('2026-07-07T02:10:00Z'))
    expect(table.latestDisplay).toBe('07/06 19:10')
  })
})
