import { buildStationTable, computePrecipCumsum } from '../../src/services/snowobs/transform'
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

const columnConfig: [string, string][] = [
  ['4', 'air_temp'],
  ['4', 'precip_accum_one_hour'],
  ['5', 'air_temp'],
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
  const table = buildStationTable(response, columnConfig)

  it('auto-inserts a cumulative-precip column after hourly precip, in config order', () => {
    expect(table.columns.map((c) => c.key)).toEqual([
      '4_air_temp',
      '4_precip_accum_one_hour',
      '4_precip_cumsum',
      '5_air_temp',
    ])
  })

  it('labels columns with short headers, long names, display units, and elevation', () => {
    const temp = table.columns.find((c) => c.key === '4_air_temp')
    expect(temp).toMatchObject({
      label: 'Temp',
      longName: 'Air Temperature',
      unit: '°F',
      elevation: 5250,
    })
    const cumsum = table.columns.find((c) => c.key === '4_precip_cumsum')
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
    expect(newest.values).toMatchObject({ '4_air_temp': null, '5_air_temp': 42 })
    // T2: both report; cumulative precip = 0.1 + 0.2
    expect(second.values).toMatchObject({
      '4_air_temp': 62,
      '4_precip_accum_one_hour': 0.2,
      '4_precip_cumsum': 0.3,
      '5_air_temp': 41,
    })
    // T1: station 4 has a null reading; station 5 reports
    expect(third.values).toMatchObject({ '4_air_temp': null, '5_air_temp': 40 })
    // T0: only station 4 reports; cumulative precip starts at 0.1
    expect(oldest.values).toMatchObject({
      '4_air_temp': 60,
      '4_precip_cumsum': 0.1,
      '5_air_temp': null,
    })
  })

  it('reports the display timezone label and latest observation time', () => {
    expect(table.timezoneLabel).toBe('PDT')
    expect(table.latestObservation).toBe(new Date(T3).getTime())
  })
})
