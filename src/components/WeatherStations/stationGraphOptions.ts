import type { GraphData, GraphSeries } from '@/services/snowobs/graph'
import { format } from 'date-fns'
import type { EChartOption } from './EChart'
import type { GraphPreset } from './stationGraphPresets'

// Builds the ECharts option for one preset chart from the graph-data response.

// Fixed palette so a band always shades in its line's color (auto-assignment
// gave the invisible band helpers their own colors).
const SERIES_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2']

function unitAxes(series: GraphSeries[]): string[] {
  const units: string[] = []
  for (const s of series) {
    if (!units.includes(s.unit)) units.push(s.unit)
  }
  return units.slice(0, 2)
}

function axisIndexFor(unit: string, axes: string[]): number {
  const index = axes.indexOf(unit)
  return index === -1 ? 0 : index
}

function seriesFor(
  s: GraphSeries,
  yAxisIndex: number,
  color: string,
  preset: GraphPreset,
  dashed: boolean,
): object {
  const symbolsOnly = preset.symbolsOnly ?? false
  const base = {
    name: s.label,
    color,
    yAxisIndex,
    data: meanPoints(s, preset.allowNegative ?? false),
    ...(symbolsOnly ? directionTooltip() : unitTooltip(s.unit)),
  }
  if (preset.bar) {
    return { ...base, type: 'bar', itemStyle: dashed ? { opacity: 0.6 } : undefined }
  }
  return {
    ...base,
    type: 'line',
    showSymbol: symbolsOnly,
    symbolSize: 4,
    lineStyle: symbolsOnly ? { opacity: 0 } : dashed ? { type: 'dashed' } : undefined,
    connectNulls: false,
  }
}

const AXIS_CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
// prettier-ignore
const ROSE_16 = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']

// Axis ticks land on 45° multiples — 8-wind keeps them readable.
export function degreesToCardinal(deg: number): string {
  return AXIS_CARDINALS[Math.round(deg / 45) % 8]
}

// Hover labels use the 16-wind rose (22.5° sectors), matching the legacy plots.
export function degreesToRose(deg: number): string {
  if (deg < 0 || deg > 360) return 'INV'
  return ROSE_16[Math.round(deg / 22.5) % 16]
}

function degreeAxisOverrides(symbolsOnly: boolean): object {
  if (!symbolsOnly) return {}
  return {
    min: 0,
    max: 360,
    interval: 45,
    axisLabel: { formatter: (deg: number) => degreesToCardinal(deg) },
  }
}

// Legacy-pinned axis bounds (RH 0-100, ...).
function presetAxisOverrides(preset: GraphPreset): object {
  if (!preset.axis) return {}
  return { ...preset.axis, scale: false }
}

// Reference line (32°F freezing on temperature) on its own empty series so it
// never inherits a real series' identity.
function refLineSeries(preset: GraphPreset): object[] {
  if (preset.refLine === undefined) return []
  return [
    {
      type: 'line',
      data: [],
      silent: true,
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', color: '#94a3b8' },
        label: { position: 'insideEndTop', formatter: String(preset.refLine) },
        data: [{ yAxis: preset.refLine }],
      },
    },
  ]
}

// Daily series plot and band on their means. Sub-zero readings are sensor
// noise except on temperature; clamp to zero.
function meanPoints(s: GraphSeries, allowNegative: boolean): [number, number | null][] {
  const points: [number, number | null][] =
    s.kind === 'raw' ? s.points : s.days.map(([t, , mean]) => [t, mean])
  if (allowNegative) return points
  return points.map(([t, v]) => [t, v === null ? v : Math.max(0, v)])
}

type BandPair = { lower: GraphSeries; upper: GraphSeries }

// Per station: when both band edges are present they render as a shaded band
// instead of their own lines. Stations missing an edge keep plain lines.
function bandPairsByStid(
  series: GraphSeries[],
  band: NonNullable<GraphPreset['band']>,
): Map<string, BandPair> {
  const pairs = new Map<string, BandPair>()
  for (const s of series) {
    if (pairs.has(s.stid)) continue
    const lower = series.find((c) => c.stid === s.stid && c.variable === band.lower)
    const upper = series.find((c) => c.stid === s.stid && c.variable === band.upper)
    if (lower && upper) pairs.set(s.stid, { lower, upper })
  }
  return pairs
}

// Lower→upper shaded band: a transparent "floor" line at the lower edge,
// stacked with (upper − lower) area on top. Aligned by timestamp; gaps in
// either edge break the band rather than guessing.
function bandSeries(
  pair: BandPair,
  yAxisIndex: number,
  color: string,
  allowNegative: boolean,
): object[] {
  const lowerByTime = new Map(meanPoints(pair.lower, allowNegative))
  const points = meanPoints(pair.upper, allowNegative).map(([t, upper]) => {
    const lower = lowerByTime.get(t) ?? null
    return { t, lower, delta: lower !== null && upper !== null ? upper - lower : null }
  })
  const stack = `band-${pair.lower.stid}`
  const helper = {
    type: 'line',
    color,
    yAxisIndex,
    stack,
    showSymbol: false,
    lineStyle: { opacity: 0 },
    tooltip: { show: false },
    legendHoverLink: false,
    silent: true,
  }
  // Helpers share the station's legend name so hiding the station via the
  // legend hides its band too.
  return [
    {
      ...helper,
      name: pair.lower.label,
      data: points.map((p) => [p.t, p.lower]),
    },
    {
      ...helper,
      name: pair.upper.label,
      areaStyle: { color, opacity: 0.14 },
      data: points.map((p) => [p.t, p.delta]),
    },
  ]
}

// Tooltip values as "SW (225°)" on direction charts.
function directionTooltip(): object {
  return {
    tooltip: {
      valueFormatter: (deg: unknown) =>
        typeof deg === 'number' ? `${degreesToRose(deg)} (${Math.round(deg)}°)` : '–',
    },
  }
}

// Tooltip values as "31.3 °F": one decimal everywhere, the series' unit appended.
function unitTooltip(unit: string): object {
  return {
    tooltip: {
      valueFormatter: (value: unknown) =>
        typeof value === 'number' && Number.isFinite(value)
          ? `${value.toFixed(1)}${unit ? ` ${unit}` : ''}`
          : '–',
    },
  }
}

// `primaryStids` marks the page's own station(s); series from any other station
// (a comparison pick) render dashed so overlapping stations stay readable.
export function buildChartOption(
  data: GraphData,
  preset: GraphPreset,
  primaryStids?: string[],
): EChartOption {
  const title = preset.title
  const symbolsOnly = preset.symbolsOnly ?? false
  const minValueSpan = (data.aggregated ? 6 * 24 : 6) * 60 * 60 * 1000
  const bands = preset.band
    ? bandPairsByStid(data.series, preset.band)
    : new Map<string, BandPair>()
  const lineSeries = data.series.filter((s) => {
    const pair = bands.get(s.stid)
    return !pair || (s !== pair.lower && s !== pair.upper)
  })
  const axes = unitAxes(lineSeries)
  const colorFor = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length]
  const series: object[] = lineSeries.map((s, i) => {
    const yAxisIndex = axisIndexFor(s.unit, axes)
    const dashed = primaryStids !== undefined && !primaryStids.includes(s.stid)
    return seriesFor(s, yAxisIndex, colorFor(i), preset, dashed)
  })
  series.push(...refLineSeries(preset))
  // Each band shades in the color of its station's line so they read as one.
  for (const [stid, pair] of bands) {
    const lineIndex = lineSeries.findIndex((s) => s.stid === stid)
    series.push(
      ...bandSeries(
        pair,
        axisIndexFor(pair.lower.unit, axes),
        colorFor(Math.max(lineIndex, 0)),
        preset.allowNegative ?? false,
      ),
    )
  }
  return {
    // Legend on its own row below the title so they don't collide.
    title: { text: title, left: 0, top: 0, textStyle: { fontSize: 15, fontWeight: 600 } },
    // Values format per-series; the header date formats here.
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        label: {
          formatter: (params: { value: unknown }) =>
            typeof params.value === 'number'
              ? format(params.value, data.aggregated ? 'EEE MMM d, yyyy' : 'EEE MMM d, HH:mm')
              : '',
        },
      },
    },
    legend: { top: 26, left: 0, type: 'scroll', data: lineSeries.map((s) => s.label) },
    // Right gutter only when a second y-axis sits there.
    grid: { left: 64, right: axes.length > 1 ? 64 : 16, top: 64, bottom: 64 },
    xAxis: {
      type: 'time',
      axisLabel: {
        hideOverlap: true,
        // Ticks lead with the day of week — forecasters think in storm days.
        formatter: {
          year: '{yyyy}',
          month: '{MMM} {yyyy}',
          day: '{ee} {MMM} {d}',
          hour: '{ee} {HH}:{mm}',
          minute: '{HH}:{mm}',
        },
      },
    },
    // Unit reads along the axis — a name above the axis top gets clipped.
    yAxis: axes.map((unit, i) => ({
      type: 'value',
      name: unit,
      nameLocation: 'middle',
      nameGap: 44,
      nameRotate: i === 0 ? 90 : -90,
      nameTextStyle: { fontSize: 12 },
      position: i === 0 ? 'left' : 'right',
      scale: true,
      splitLine: { show: i === 0 },
      ...degreeAxisOverrides(symbolsOnly),
      ...presetAxisOverrides(preset),
    })),
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, minValueSpan },
      { type: 'slider', xAxisIndex: 0, height: 18, bottom: 8, minValueSpan },
    ],
    series,
  }
}
