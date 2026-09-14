import { buildChartOption } from '@/components/WeatherStations/stationGraphOptions'
import {
  applyGroupAxes,
  STATION_GRAPH_PRESETS,
} from '@/components/WeatherStations/stationGraphPresets'
import { getStationGroup } from '@/constants/weatherStations'
import type { GraphData } from '@/services/snowobs/graph'

const byKey = (presets: typeof STATION_GRAPH_PRESETS, key: string) =>
  presets.find((p) => p.key === key)

function snowDepthData(max: number): GraphData {
  return {
    series: [
      {
        kind: 'raw',
        stid: '1',
        stationName: 'Station 1',
        variable: 'snow_depth',
        label: 'Station 1',
        unit: 'in',
        points: [
          [1_700_000_000_000, 10],
          [1_700_003_600_000, max],
        ],
      },
    ],
    aggregated: false,
    timezone: 'x',
  }
}

function firstAxisMax(data: GraphData, presets: typeof STATION_GRAPH_PRESETS): number | undefined {
  const preset = byKey(presets, 'snowdepth')
  if (!preset) throw new Error('no snowdepth preset')
  const { yAxis } = buildChartOption(data, preset)
  const axis: unknown = Array.isArray(yAxis) ? yAxis[0] : undefined
  return typeof axis === 'object' && axis !== null && 'max' in axis && typeof axis.max === 'number'
    ? axis.max
    : undefined
}

describe('applyGroupAxes', () => {
  it('returns the presets untouched when the group has no overrides', () => {
    expect(applyGroupAxes(STATION_GRAPH_PRESETS, undefined)).toBe(STATION_GRAPH_PRESETS)
  })

  it('lets an override win over the preset default and keeps the other bound', () => {
    const presets = applyGroupAxes(STATION_GRAPH_PRESETS, { snowdepth: { max: 225 } })
    expect(byKey(presets, 'snowdepth')?.axis).toEqual({ min: 0, max: 225 })
  })

  it('falls back to the preset default for keys the group does not set', () => {
    const presets = applyGroupAxes(STATION_GRAPH_PRESETS, { snowdepth: { max: 225 } })
    expect(byKey(presets, 'precip')).toBe(byKey(STATION_GRAPH_PRESETS, 'precip'))
    expect(byKey(presets, 'snow24')?.axis).toEqual({ min: 0, max: 24 })
  })

  it('is still a floor: data beyond the override widens the axis', () => {
    const presets = applyGroupAxes(STATION_GRAPH_PRESETS, { snowdepth: { max: 85 } })
    // Bounds round outward to a gridline, so 85 lands on 100, still under the default 150.
    expect(firstAxisMax(snowDepthData(40), presets)).toBe(100)
    expect(firstAxisMax(snowDepthData(120), presets)).toBeGreaterThanOrEqual(120)
  })

  it('resolves the same bounds as before for a group without overrides', () => {
    const group = getStationGroup('hurricane-ridge')
    expect(group?.graphAxes).toBeUndefined()
    const presets = applyGroupAxes(STATION_GRAPH_PRESETS, group?.graphAxes)
    expect(firstAxisMax(snowDepthData(40), presets)).toBe(
      firstAxisMax(snowDepthData(40), STATION_GRAPH_PRESETS),
    )
    expect(firstAxisMax(snowDepthData(40), presets)).toBe(150)
  })

  it('carries the legacy per-region floors in the registry', () => {
    expect(getStationGroup('paradise')?.graphAxes).toEqual({ snowdepth: { max: 225 } })
    expect(getStationGroup('mission-ridge')?.graphAxes).toEqual({
      snowdepth: { max: 100 },
      snow24: { max: 20 },
      precip: { max: 0.28 },
    })
  })
})
