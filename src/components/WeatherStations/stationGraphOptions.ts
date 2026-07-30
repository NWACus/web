import type { GraphData, GraphSeries } from '@/services/snowobs/graph'
import type { EChartOption } from './EChart'
import type { GraphPreset } from './stationGraphPresets'

// Builds the ECharts option for one preset chart from the graph-data response.
// Raw series render as lines; daily-aggregated series render as a mean line
// plus a shaded min→max band (two stacked helper series).

// Fixed palette so a series' min-max band always shades in ITS line's color
// (auto-assignment gave the invisible band helpers their own colors).
const SERIES_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2']

// Series grouped onto up to two y-axes by unit (°F and % on one chart, etc.).
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

// One ECharts line per series. Raw series plot their points; daily-aggregated
// series plot their mean line. symbolsOnly (direction charts) renders
// disconnected dots instead of a line.
function seriesFor(
  s: GraphSeries,
  yAxisIndex: number,
  color: string,
  symbolsOnly: boolean,
  dashed: boolean,
): object {
  return {
    name: s.label,
    type: 'line',
    color,
    yAxisIndex,
    showSymbol: symbolsOnly,
    symbolSize: 4,
    lineStyle: symbolsOnly ? { opacity: 0 } : dashed ? { type: 'dashed' } : undefined,
    connectNulls: false,
    data: meanPoints(s),
    ...directionTooltip(symbolsOnly),
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

// Compass scale for wind direction: cardinal tick labels every 45°.
function degreeAxisOverrides(symbolsOnly: boolean): object {
  if (!symbolsOnly) return {}
  return {
    min: 0,
    max: 360,
    interval: 45,
    axisLabel: { formatter: (deg: number) => degreesToCardinal(deg) },
  }
}

// Preset-pinned axis bounds (RH 0-100, ...), matching the legacy plot specs.
function presetAxisOverrides(preset: GraphPreset): object {
  if (!preset.axis) return {}
  return { ...preset.axis, scale: false }
}

// Legacy-style horizontal reference line (32°F freezing on temperature),
// carried by its own empty series so it never inherits a real series' identity.
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

// Mean points regardless of series kind — daily series plot and band on their means.
function meanPoints(s: GraphSeries): [number, number | null][] {
  if (s.kind === 'raw') return s.points
  return s.days.map(([t, , mean]) => [t, mean])
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
function bandSeries(pair: BandPair, yAxisIndex: number, color: string): object[] {
  const lowerByTime = new Map(meanPoints(pair.lower))
  const points = meanPoints(pair.upper).map(([t, upper]) => {
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
  return [
    {
      ...helper,
      name: `${pair.lower.label} ${pair.lower.variable}`,
      data: points.map((p) => [p.t, p.lower]),
    },
    {
      ...helper,
      name: `${pair.upper.label} ${pair.upper.variable}`,
      areaStyle: { color, opacity: 0.14 },
      data: points.map((p) => [p.t, p.delta]),
    },
  ]
}

// Tooltip values as "SW (225°)" on direction charts.
function directionTooltip(symbolsOnly: boolean): object {
  if (!symbolsOnly) return {}
  return {
    tooltip: {
      valueFormatter: (deg: unknown) =>
        typeof deg === 'number' ? `${degreesToRose(deg)} (${Math.round(deg)}°)` : '–',
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
    return seriesFor(s, yAxisIndex, colorFor(i), symbolsOnly, dashed)
  })
  series.push(...refLineSeries(preset))
  // Each band shades in the color of its station's line so they read as one.
  for (const [stid, pair] of bands) {
    const lineIndex = lineSeries.findIndex((s) => s.stid === stid)
    series.push(
      ...bandSeries(pair, axisIndexFor(pair.lower.unit, axes), colorFor(Math.max(lineIndex, 0))),
    )
  }
  return {
    // Title top-left, legend on its own row below — they no longer collide.
    title: { text: title, left: 0, top: 0, textStyle: { fontSize: 15, fontWeight: 600 } },
    tooltip: { trigger: 'axis' },
    legend: { top: 26, left: 0, type: 'scroll', data: lineSeries.map((s) => s.label) },
    // Right gutter only when a second y-axis sits there.
    grid: { left: 64, right: axes.length > 1 ? 64 : 16, top: 64, bottom: 64 },
    xAxis: {
      type: 'time',
      axisLabel: {
        hideOverlap: true,
        // Lead date-level ticks with the day of week ("Mon Jul 20"; hourly
        // ticks "Mon 14:00") — forecasters think in storm days.
        formatter: {
          year: '{yyyy}',
          month: '{MMM} {yyyy}',
          day: '{ee} {MMM} {d}',
          hour: '{ee} {HH}:{mm}',
          minute: '{HH}:{mm}',
        },
      },
    },
    // Unit reads along the axis (rotated, centered) instead of a clipped label
    // floating above the axis top.
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
