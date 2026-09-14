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
    data: meanPoints(s),
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

type Bounds = { min: number; max: number }

function isFiniteNumber(v: number | null | undefined): v is number {
  return v !== null && v !== undefined && Number.isFinite(v)
}

function plottedValues(s: GraphSeries): (number | null)[] {
  return s.kind === 'raw' ? s.points.map(([, v]) => v) : s.days.flatMap(([, lo, , hi]) => [lo, hi])
}

// Reduced rather than spread into Math.min — a season of hourly data across
// several stations is more arguments than a call frame should carry.
function dataExtent(series: GraphSeries[]): Bounds | null {
  const values = series.flatMap(plottedValues).filter(isFiniteNumber)
  if (values.length === 0) return null
  return values.reduce<Bounds>(
    (acc, v) => ({ min: Math.min(acc.min, v), max: Math.max(acc.max, v) }),
    { min: Infinity, max: -Infinity },
  )
}

// 1/2/2.5/5/10 x 10^n — the step sizes that produce readable gridlines.
function niceStep(rough: number): number {
  if (!(rough > 0)) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)))
  for (const step of [1, 2, 2.5, 5]) {
    if (rough <= step * magnitude) return step * magnitude
  }
  return 10 * magnitude
}

// `floor` is a floor and not a ceiling: real data beyond it widens the axis
// instead of clipping, where legacy rendered a 0.6in/hr hour flat-topped at the
// 0.35 bound.
function axisSpan(series: GraphSeries[], floor?: GraphPreset['axis']): Bounds | null {
  const extent = dataExtent(series)
  const mins = [extent?.min, floor?.min].filter(isFiniteNumber)
  const maxes = [extent?.max, floor?.max].filter(isFiniteNumber)
  if (mins.length === 0 || maxes.length === 0) return null
  return { min: Math.min(...mins), max: Math.max(...maxes) }
}

function roundOutward({ min, max }: Bounds): Bounds {
  // A dead-flat series (a rainless week) has no range to divide into steps.
  if (min === max) return { min: min - 1, max: max + 1 }
  const step = niceStep((max - min) / 4)
  return { min: Math.floor(min / step) * step, max: Math.ceil(max / step) * step }
}

// Resolved once per data load, and passed to ECharts explicitly, so panning and
// zooming leave the axis where it is.
function frozenAxisBounds(series: GraphSeries[], floor?: GraphPreset['axis']): Bounds | null {
  const span = axisSpan(series, floor)
  return span && roundOutward(span)
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

// Daily series plot and band on their means.
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
      ...bandSeries(pair, axisIndexFor(pair.lower.unit, axes), colorFor(Math.max(lineIndex, 0))),
    )
  }
  return {
    // Legend on its own row below the title so they don't collide.
    title: { text: title, left: 0, top: 0, textStyle: { fontSize: 15, fontWeight: 600 } },
    // Values format per-series; the header date formats here.
    tooltip: {
      trigger: 'axis',
      // ECharts hard-codes z-index:9999999 on its tooltip div, which floats it over the
      // site header, nav dropdowns and dialogs. extraCssText lands after that default.
      extraCssText: 'z-index: 10;',
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
      // Only the first axis takes the preset's floor; a second axis is a
      // different unit the floor doesn't describe.
      ...frozenAxisBounds(
        data.series.filter((s) => axisIndexFor(s.unit, axes) === i),
        i === 0 ? preset.axis : undefined,
      ),
      ...degreeAxisOverrides(symbolsOnly),
    })),
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, minValueSpan, zoomOnMouseWheel: 'ctrl' },
      { type: 'slider', xAxisIndex: 0, height: 18, bottom: 8, minValueSpan },
    ],
    series,
  }
}
