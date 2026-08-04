import { convertGraphData, convertPreset } from '@/components/WeatherStations/stationGraphUnits'
import { useUnitSystem } from '@/components/WeatherStations/UnitToggle'
import type { GraphData } from '@/services/snowobs/graph'
import { act, renderHook } from '@testing-library/react'

const T = 1_700_000_000_000

function rawSeries(variable: string, unit: string, value: number): GraphData['series'][number] {
  return {
    kind: 'raw',
    stid: '1',
    stationName: 'Station 1',
    variable,
    label: 'Station 1',
    unit,
    points: [[T, value]],
  }
}

describe('convertGraphData', () => {
  it('converts values and unit labels to metric', () => {
    const data: GraphData = {
      series: [
        rawSeries('air_temp', '°F', 32),
        rawSeries('wind_speed', 'mph', 10),
        rawSeries('snow_depth', 'in', 10),
        rawSeries('precip_accum_one_hour', 'in', 1),
      ],
      aggregated: false,
      timezone: 'x',
    }
    const [temp, wind, snow, precip] = convertGraphData(data, 'metric').series
    expect(temp).toMatchObject({ unit: '°C', points: [[T, 0]] })
    expect(wind).toMatchObject({ unit: 'km/h', points: [[T, 16.09344]] })
    expect(snow).toMatchObject({ unit: 'cm', points: [[T, 25.4]] })
    expect(precip).toMatchObject({ unit: 'mm', points: [[T, 25.4]] })
  })

  it('converts daily min/mean/max rows', () => {
    const data: GraphData = {
      series: [
        {
          kind: 'daily',
          stid: '1',
          stationName: 'Station 1',
          variable: 'air_temp',
          label: 'Station 1',
          unit: '°F',
          days: [[T, 32, 41, 50]],
        },
      ],
      aggregated: true,
      timezone: 'x',
    }
    expect(convertGraphData(data, 'metric').series[0]).toMatchObject({
      unit: '°C',
      days: [[T, 0, 5, 10]],
    })
  })

  it('passes unconvertible variables and imperial through untouched', () => {
    const data: GraphData = {
      series: [rawSeries('relative_humidity', '%', 80)],
      aggregated: false,
      timezone: 'x',
    }
    expect(convertGraphData(data, 'metric').series[0]).toMatchObject({ unit: '%' })
    expect(convertGraphData(data, 'imperial')).toBe(data)
  })
})

describe('convertPreset', () => {
  const TEMP_PRESET = {
    key: 'temp',
    title: 'Temperature',
    variables: ['air_temp'],
    refLine: 32,
  }

  it('converts the freezing reference line to 0°C', () => {
    expect(convertPreset(TEMP_PRESET, 'metric').refLine).toBe(0)
    expect(convertPreset(TEMP_PRESET, 'imperial')).toBe(TEMP_PRESET)
  })
})

describe('useUnitSystem', () => {
  it('defaults to imperial and persists the choice per browser', () => {
    const first = renderHook(() => useUnitSystem())
    expect(first.result.current[0]).toBe('imperial')
    act(() => first.result.current[1]('metric'))
    expect(first.result.current[0]).toBe('metric')
    first.unmount()

    const second = renderHook(() => useUnitSystem())
    expect(second.result.current[0]).toBe('metric')
    window.localStorage.clear()
  })
})
