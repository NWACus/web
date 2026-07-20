import {
  aggregateDaily,
  buildGraphData,
  DECIMATION_THRESHOLD_DAYS,
  vectorMeanDegrees,
  windowExceedsThreshold,
} from '../../src/services/snowobs/graph'
import type { SnowObsTimeseriesResponse } from '../../src/services/snowobs/types/schemas'

const HOUR = 60 * 60 * 1000
// Noon UTC = early morning in America/Vancouver; hours 0-5 stay on one local day.
const T0 = new Date('2026-01-10T12:00:00Z').getTime()
const iso = (hoursAfter: number) => new Date(T0 + hoursAfter * HOUR).toISOString()

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
      latitude: 47.9,
      longitude: -123.4,
      elevation: 5250,
      observations: {
        date_time: [iso(0), iso(1), iso(2)],
        air_temp: [30, null, 34],
        snow_depth: [100, 101, 102],
      },
    },
  ],
}

describe('buildGraphData', () => {
  it('emits one raw series per station/variable with nulls preserved', () => {
    const data = buildGraphData(response, ['4'], ['air_temp', 'snow_depth'], false)
    expect(data.aggregated).toBe(false)
    expect(data.series).toHaveLength(2)
    const temp = data.series[0]
    if (temp.kind !== 'raw') throw new Error('expected raw series')
    expect(temp.label).toBe('Hurricane Ridge · Temp')
    expect(temp.unit).toBe('°F')
    expect(temp.points.map(([, v]) => v)).toEqual([30, null, 34])
  })

  it('skips unknown stations and absent variables', () => {
    const data = buildGraphData(response, ['4', 'nope'], ['air_temp', 'wind_speed'], false)
    expect(data.series).toHaveLength(1)
  })

  it('aggregates to daily min/mean/max when requested', () => {
    const data = buildGraphData(response, ['4'], ['air_temp'], true)
    const series = data.series[0]
    if (series.kind !== 'daily') throw new Error('expected daily series')
    // 30 and 34 fall on the same display-timezone day; null dropped.
    expect(series.days).toHaveLength(1)
    const [, min, mean, max] = series.days[0]
    expect([min, mean, max]).toEqual([30, 32, 34])
  })
})

describe('aggregateDaily', () => {
  it('buckets by display-timezone day and omits all-null days', () => {
    const days = aggregateDaily([
      [T0, 10],
      [T0 + 26 * HOUR, null],
      [T0 + 48 * HOUR, 20],
    ])
    expect(days).toHaveLength(2)
    expect(days[0][1]).toBe(10)
    expect(days[1][1]).toBe(20)
  })
})

describe('windowExceedsThreshold', () => {
  it('flags windows beyond the threshold only', () => {
    const from = new Date(T0)
    const under = new Date(T0 + (DECIMATION_THRESHOLD_DAYS - 1) * 24 * HOUR)
    const over = new Date(T0 + (DECIMATION_THRESHOLD_DAYS + 1) * 24 * HOUR)
    expect(windowExceedsThreshold(from, under)).toBe(false)
    expect(windowExceedsThreshold(from, over)).toBe(true)
  })
})

describe('vectorMeanDegrees', () => {
  it('averages across the north wrap correctly', () => {
    // Arithmetic mean of 350 and 10 is 180 (dead wrong); vector mean is 0.
    expect(vectorMeanDegrees([350, 10])).toBe(0)
    expect(vectorMeanDegrees([90, 90])).toBe(90)
    expect(vectorMeanDegrees([0, 90])).toBe(45)
  })

  it('pins min/max to the vector mean in circular aggregation', () => {
    const days = aggregateDaily(
      [
        [Date.UTC(2026, 0, 10, 12), 350],
        [Date.UTC(2026, 0, 10, 13), 10],
      ],
      true,
    )
    expect(days[0].slice(1)).toEqual([0, 0, 0])
  })
})
