import { STATION_GRAPH_PRESETS } from '@/components/WeatherStations/stationGraphPresets'
import { clampNegativeValues } from '@/components/WeatherStations/stationGraphUnits'
import { useUnitSystem } from '@/components/WeatherStations/UnitToggle'
import type { GraphData } from '@/services/snowobs/graph'
import { act, renderHook } from '@testing-library/react'

const T = 1_700_000_000_000

function rawSeries(variable: string, unit: string, value: number): GraphData['series'][number] {
  return {
    kind: 'raw',
    key: 'nwac:1',
    stid: '1',
    source: 'nwac',
    stationName: 'Station 1',
    variable,
    label: 'Station 1',
    unit,
    decimals: 1,
    points: [[T, value]],
  }
}

describe('clampNegativeValues', () => {
  it('clamps raw points and daily rows to zero', () => {
    const data: GraphData = {
      series: [
        rawSeries('snow_depth', 'in', -0.4),
        {
          kind: 'daily',
          key: 'nwac:1',
          stid: '1',
          source: 'nwac',
          stationName: 'Station 1',
          variable: 'wind_speed',
          label: 'Station 1',
          unit: 'mph',
          decimals: 1,
          days: [[T, -1, 2, 5]],
        },
      ],
      aggregated: false,
      timezone: 'x',
    }
    const [snow, wind] = clampNegativeValues(data).series
    expect(snow).toMatchObject({ points: [[T, 0]] })
    expect(wind).toMatchObject({ days: [[T, 0, 2, 5]] })
  })
})

it('both temperature presets allow negative values', () => {
  const temps = STATION_GRAPH_PRESETS.filter((p) => p.variables[0].includes('temp'))
  expect(temps.map((p) => p.key)).toEqual(['temp', 'equiptemp'])
  expect(temps.every((p) => p.allowNegative)).toBe(true)
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
