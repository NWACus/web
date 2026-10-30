import { buildChartOption } from '@/components/WeatherStations/stationGraphOptions'
import type { GraphPreset } from '@/components/WeatherStations/stationGraphPresets'
import { presetFor, STATION_GRAPH_PRESETS } from '@/components/WeatherStations/stationGraphPresets'
import type { GraphData } from '@/services/snowobs/graph'

function preset(key: string): GraphPreset {
  const found = STATION_GRAPH_PRESETS.find((p) => p.key === key)
  if (!found) throw new Error(`no ${key} preset`)
  return found
}

function data(variable: string, values: number[]): GraphData {
  return {
    series: [
      {
        kind: 'raw',
        key: 'nwac:1',
        stid: '1',
        source: 'nwac',
        stationName: 'Station 1',
        variable,
        label: 'Station 1',
        unit: 'in',
        decimals: 0,
        points: values.map((v, i) => [1_700_000_000_000 + i * 3_600_000, v]),
      },
    ],
    aggregated: false,
    timezone: 'x',
  }
}

function axisBounds(chart: GraphData, p: GraphPreset): { min?: number; max?: number } {
  const { yAxis } = buildChartOption(chart, p)
  const axis: unknown = Array.isArray(yAxis) ? yAxis[0] : undefined
  if (typeof axis !== 'object' || axis === null) throw new Error('no y axis')
  return {
    min: 'min' in axis && typeof axis.min === 'number' ? axis.min : undefined,
    max: 'max' in axis && typeof axis.max === 'number' ? axis.max : undefined,
  }
}

describe('axis bounds', () => {
  it('pins amounts at zero and stretches a quiet week to the minimum span', () => {
    // 5" of snow-depth noise on a 12" minimum span: 0..12, rounded out to a gridline.
    expect(axisBounds(data('snow_depth', [4, 5, 5.75]), preset('snowdepth'))).toEqual({
      min: 0,
      max: 15,
    })
  })

  it('lets real data widen the axis past the span', () => {
    const { min, max } = axisBounds(data('snow_depth', [10, 120]), preset('snowdepth'))
    expect(min).toBe(0)
    expect(max).toBeGreaterThanOrEqual(120)
  })

  it('sizes a daily series to the means it draws, not the day extremes', () => {
    const daily: GraphData = {
      series: [
        {
          kind: 'daily',
          key: 'nwac:1',
          stid: '1',
          source: 'nwac',
          stationName: 'Station 1',
          variable: 'precip_accum_one_hour',
          label: 'Station 1',
          unit: 'in',
          decimals: 0,
          days: [
            [1_700_000_000_000, 0, 0.2, 5.2],
            [1_700_086_400_000, 0, 0.4, 0.6],
          ],
        },
      ],
      aggregated: true,
      timezone: 'x',
    }
    expect(axisBounds(daily, preset('precip')).max).toBeLessThan(1)
  })

  it('centres an unpinned axis on flat data', () => {
    expect(axisBounds(data('air_temp', [30, 30, 30]), preset('temp'))).toEqual({ min: 25, max: 35 })
  })

  it('swaps in the metric reference line and axis', () => {
    expect(presetFor(preset('temp'), 'metric')).toMatchObject({ refLine: 0, axis: { minSpan: 5 } })
    expect(presetFor(preset('snowdepth'), 'metric').axis).toEqual({ min: 0, minSpan: 30 })
    expect(presetFor(preset('temp'), 'imperial')).toMatchObject({
      refLine: 32,
      axis: { minSpan: 10 },
    })
  })

  it('keeps a preset with no unit to change, like pressure in millibar', () => {
    expect(presetFor(preset('pressure'), 'metric')).toBe(preset('pressure'))
  })
})
