/**
 * The ECharts options for the charts tab's seven charts, reproducing the legacy widget's Vega-Lite
 * specs (`apps/observations/vega/*.json`): its colours, categories, labels and ordering. Pure, so
 * they are unit-testable without a canvas.
 *
 * Every builder takes an optional `title`. On screen the card's heading already says it, so the
 * title is only asked for when exporting — a saved PNG travels without the card.
 */
import { format, parseISO } from 'date-fns'

import type { EChartOption } from '@/components/charts/EChart'
import type {
  AspectElevationRose,
  InstabilityKind,
  SizeBand,
  StatCount,
  StatsAggregation,
  StatsBucket,
} from '@/services/nac/model/observation'
import { AVALANCHE_PROBLEMS } from '@/services/nac/observations/options'

import { scopeText, type CountScope } from '../list/countScope'

/** The widget's bar and rose colour (`#006e97`, NAC's blue). */
export const CHART_BLUE = '#006e97'

/** The donuts' and stacks' colours, the widget's `scale.range` per category. */
export const TRIGGER_COLORS: Record<string, string> = {
  Human: '#dc3545',
  Natural: '#fd7e14',
  Unknown: CHART_BLUE,
  Explosive: '#ffc107',
  Wildlife: '#964B00',
}

export const SIZE_COLORS: Record<SizeBand, string> = {
  D1: '#ffc107',
  D2: '#fd7e14',
  D3: '#dc3545',
  'D4-5': '#000000',
}

export const SIZE_SERIES: { key: SizeBand; label: string; color: string }[] = [
  { key: 'D1', label: 'D1', color: SIZE_COLORS.D1 },
  { key: 'D2', label: 'D2', color: SIZE_COLORS.D2 },
  { key: 'D3', label: 'D3', color: SIZE_COLORS.D3 },
  { key: 'D4-5', label: 'D4-5', color: SIZE_COLORS['D4-5'] },
]

export const INSTABILITY_SERIES: { key: InstabilityKind; label: string; color: string }[] = [
  { key: 'avalanchesObserved', label: 'Avalanches Observed', color: '#dc3545' },
  { key: 'crackingCollapsing', label: 'Cracking/Collapsing Observed', color: '#fd7e14' },
  { key: 'noInstability', label: 'No Instability Observed', color: CHART_BLUE },
]

/** The bar charts' and time series' pixel height, the widget's plot plus its angled labels. */
export const BAR_CHART_HEIGHT = 360
export const DONUT_CHART_HEIGHT = 300
export const ROSE_CHART_HEIGHT = 420
export const ROSE_CHART_HEIGHT_NARROW = 340

const TITLE_TOP = 8
const GRID_TOP = 16
const GRID_TOP_WITH_TITLE = 48
const GRID_LEFT = 56
const GRID_LEFT_NARROW = 44

interface ChartOptions {
  title?: string
  /** Lays the chart out for a phone: steeper labels, a stacked legend. Never set for an export. */
  narrow?: boolean
}

function titleOption(title: string | undefined) {
  return {
    show: title !== undefined,
    text: title ?? '',
    left: 'center',
    top: TITLE_TOP,
    textStyle: { fontSize: 16, fontWeight: 'bold' },
  }
}

/** ECharts hard-codes z-index:9999999 on its tooltip div; extraCssText lands after that default. */
const TOOLTIP_BASE = { extraCssText: 'z-index: 10;', confine: true }

function isDataItem(value: unknown): value is { name?: unknown; value?: unknown } {
  return typeof value === 'object' && value !== null
}

/** "Stevens Pass: 94", the widget's bar and slice tooltip. */
function itemTooltip(params: unknown): string {
  if (!isDataItem(params)) return ''
  const { name, value } = params
  if (typeof name !== 'string') return ''
  const count = Array.isArray(value) ? value[value.length - 1] : value
  return typeof count === 'number' ? `${name}: ${count}` : ''
}

/** Room under the plot for category labels rotated by `rotate` degrees and up to `chars` long. */
function labelGutter(rotate: number, chars: number): number {
  const length = chars * 7
  return Math.round(length * Math.sin((rotate * Math.PI) / 180)) + 28
}

interface BarChart {
  categories: string[]
  counts: number[]
  rotate: number
  yName: string
}

function barChartOption(bar: BarChart, { title, narrow = false }: ChartOptions): EChartOption {
  const longest = Math.max(0, ...bar.categories.map((name) => name.length))
  return {
    animation: false,
    title: titleOption(title),
    grid: {
      left: narrow ? GRID_LEFT_NARROW : GRID_LEFT,
      right: 16,
      top: title === undefined ? GRID_TOP : GRID_TOP_WITH_TITLE,
      bottom: labelGutter(bar.rotate, Math.min(longest, 22)),
    },
    tooltip: { ...TOOLTIP_BASE, trigger: 'item', formatter: itemTooltip },
    xAxis: {
      type: 'category',
      data: bar.categories,
      axisTick: { alignWithLabel: true },
      axisLabel: {
        interval: 0,
        rotate: bar.rotate,
        fontSize: narrow ? 11 : 13,
        width: 150,
        overflow: 'truncate',
      },
    },
    yAxis: {
      type: 'value',
      name: bar.yName,
      nameLocation: 'middle',
      nameGap: narrow ? 30 : 40,
      nameTextStyle: { fontSize: narrow ? 12 : 14 },
      minInterval: 1,
    },
    series: [
      {
        type: 'bar',
        // The widget's 3% band padding, capped so two zones don't become two slabs.
        barCategoryGap: '3%',
        barMaxWidth: 64,
        cursor: 'default',
        itemStyle: { color: CHART_BLUE },
        emphasis: { itemStyle: { opacity: 0.8 } },
        data: bar.counts,
      },
    ],
  }
}

/** Avalanches by zone (or by center when the map is zoomed out), in the API's order. */
export function zoneChartOption(zones: StatCount[], options: ChartOptions = {}): EChartOption {
  return barChartOption(
    {
      categories: zones.map((zone) => zone.name),
      counts: zones.map((zone) => zone.count),
      rotate: options.narrow ? 60 : 30,
      yName: 'Number of Avalanches',
    },
    options,
  )
}

/** Avalanches by problem over the fixed nine names, in the widget's order, zeros included. */
export function problemChartOption(
  problems: StatCount[],
  options: ChartOptions = {},
): EChartOption {
  const byName = new Map(problems.map((problem) => [problem.name, problem.count]))
  return barChartOption(
    {
      categories: [...AVALANCHE_PROBLEMS],
      counts: AVALANCHE_PROBLEMS.map((name) => byName.get(name) ?? 0),
      rotate: options.narrow ? 70 : 30,
      yName: 'Number of Avalanches',
    },
    options,
  )
}

/**
 * A donut of a breakdown, each slice in its category's colour. A slice the API marks wide enough
 * carries its name; the rest show theirs on hover, and the legend names them all.
 */
export function donutChartOption(
  items: StatCount[],
  colors: Record<string, string>,
  { title, narrow = false }: ChartOptions = {},
): EChartOption {
  const slices = items.filter((item) => item.count > 0)
  return {
    animation: false,
    title: titleOption(title),
    tooltip: { ...TOOLTIP_BASE, trigger: 'item', formatter: itemTooltip },
    legend: {
      bottom: 0,
      left: 'center',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: narrow ? ['34%', '64%'] : ['38%', '70%'],
        center: ['50%', title === undefined ? '46%' : '50%'],
        cursor: 'default',
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        label: {
          position: 'inside',
          formatter: '{b}',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
        },
        labelLine: { show: false },
        emphasis: { label: { show: true }, itemStyle: { opacity: 0.8 } },
        data: slices.map((item) => ({
          name: item.name,
          value: item.count,
          itemStyle: { color: colors[item.name] ?? CHART_BLUE },
          label: { show: item.showLabel },
        })),
      },
    ],
  }
}

// ─── Time series ────────────────────────────────────────────────────────────

/** How the widget formats a bucket's axis label: "2/8" for a day or week, "Feb" for a month. */
export function bucketLabel(date: string, aggregation: StatsAggregation): string {
  return format(parseISO(date), aggregation === 'monthly' ? 'MMM' : 'M/d')
}

/** A bucket's span for its tooltip: "2/8" for a day, "2/8 – 2/14" for a week or month. */
export function bucketSpan(bucket: Pick<StatsBucket<string>, 'date' | 'periodEnd'>): string {
  const from = format(parseISO(bucket.date), 'M/d')
  if (bucket.periodEnd === bucket.date) return from
  return `${from} – ${format(parseISO(bucket.periodEnd), 'M/d')}`
}

export interface TimeSeries<K extends string> {
  buckets: StatsBucket<K>[]
  aggregation: StatsAggregation
  series: { key: K; label: string; color: string }[]
  yName: string
}

function isSeriesParam(
  value: unknown,
): value is { seriesName?: unknown; value?: unknown; dataIndex?: unknown } {
  return typeof value === 'object' && value !== null
}

/** The bucket's span, then each series with a count, as the tooltip for an axis trigger. */
function timeTooltip<K extends string>(buckets: StatsBucket<K>[], params: unknown): string {
  const rows = Array.isArray(params) ? params.filter(isSeriesParam) : []
  const first = rows[0]
  if (!first || typeof first.dataIndex !== 'number') return ''
  const bucket = buckets[first.dataIndex]
  if (!bucket) return ''
  const lines = rows
    .filter((row) => typeof row.value === 'number' && row.value > 0)
    .map((row) => `${String(row.seriesName)}: ${String(row.value)}`)
  return [bucketSpan(bucket), ...(lines.length > 0 ? lines : ['None'])].join('<br/>')
}

/** The legend's height: one row, or one per series when stacked on a phone. */
function legendHeight(seriesCount: number, narrow: boolean): number {
  return narrow ? seriesCount * 22 : 26
}

function timeAxisRotate(aggregation: StatsAggregation): number {
  return aggregation === 'daily' ? 30 : 45
}

/** Stacked bars per bucket, one series per category, as the widget's two time charts draw them. */
export function timeSeriesOption<K extends string>(
  chart: TimeSeries<K>,
  { title, narrow = false }: ChartOptions = {},
): EChartOption {
  const { buckets, aggregation, series, yName } = chart
  const rotate = timeAxisRotate(aggregation)
  const legend = legendHeight(series.length, narrow)
  return {
    animation: false,
    title: titleOption(title),
    grid: {
      left: narrow ? GRID_LEFT_NARROW : GRID_LEFT,
      right: 16,
      top: title === undefined ? GRID_TOP : GRID_TOP_WITH_TITLE,
      bottom: labelGutter(rotate, 5) + legend,
    },
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => timeTooltip(buckets, params),
    },
    legend: {
      bottom: 0,
      left: 'center',
      orient: narrow ? 'vertical' : 'horizontal',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { fontSize: 12 },
      data: series.map((entry) => entry.label),
    },
    xAxis: {
      type: 'category',
      data: buckets.map((bucket) => bucketLabel(bucket.date, aggregation)),
      axisTick: { alignWithLabel: true },
      axisLabel: { rotate, fontSize: narrow ? 11 : 12, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      name: yName,
      nameLocation: 'middle',
      nameGap: narrow ? 30 : 40,
      nameTextStyle: { fontSize: narrow ? 12 : 14 },
      minInterval: 1,
    },
    series: series.map((entry) => ({
      name: entry.label,
      type: 'bar',
      stack: 'total',
      // The widget's 10% band padding; weeks and months pack tighter so the bars read as a run.
      barCategoryGap: aggregation === 'daily' ? '10%' : '4%',
      cursor: 'default',
      itemStyle: { color: entry.color },
      emphasis: { focus: 'none', itemStyle: { opacity: 0.8 } },
      data: buckets.map((bucket) => bucket.counts[entry.key]),
    })),
  }
}

// ─── Aspect and elevation rose ──────────────────────────────────────────────

export type RoseMode = 'circles' | 'numbers'

/**
 * The aspects clockwise from south-east, with the first band starting at -22.5°: north is then
 * centred at the top, the polar grid's spokes fall between aspects (the widget's -22.5° theta
 * offset), and the radius axis — which ECharts draws at the start angle — runs out along the
 * east/south-east spoke, where the widget wrote its elevation labels.
 */
const ROSE_ANGLE_ORDER = ['SE', 'S', 'SW', 'W', 'NW', 'N', 'NE', 'E'] as const
const ROSE_START_ANGLE = -22.5

const ROSE_GRID_COLOR = '#A8AAAC'
const ROSE_LABEL_COLOR = '#515558'

/**
 * Where a band's cell sits along the radius. Ring 0 is left empty, as the widget leaves its
 * centre, and the highest band is innermost: the widget's `(reversedBin + 1.5) * step`.
 */
export function roseRadius(band: number, bandCount: number): number {
  return bandCount - 1 - band + 1.5
}

/**
 * The label at ring edge `edge`, as the widget placed them: the top of the highest band, with the
 * unit, sits in the empty centre (edge 0) rather than on the innermost ring's edge where it would
 * crowd the first cells; every other edge is labelled when its elevation is a whole thousand
 * feet. Edge `k` (k ≥ 2) is the top of the band `k` rings in; the outermost is the lowest's floor.
 */
export function roseEdgeLabel(edge: number, bands: AspectElevationRose['bands']): string {
  const count = bands.length
  if (count === 0 || edge < 0 || edge > count + 1) return ''
  if (edge === 0) return roundThousands(bands[count - 1].to, 'k ft')
  if (edge === 1) return ''
  return roundThousands(edge <= count ? bands[count - edge].to : bands[0].from, '')
}

function roundThousands(elevation: number, suffix: string): string {
  return elevation % 1000 === 0 ? `${elevation / 1000}${suffix}` : ''
}

/** A circle's diameter: area in proportion to the count, the largest just over a ring wide. */
function circleDiameter(count: number, max: number, ring: number): number {
  return Math.sqrt(count / max) * ring * 1.3
}

interface RoseChartOptions extends ChartOptions {
  mode: RoseMode
  /** The chart's pixel height, which sets how wide a ring is and so how large a circle may be. */
  height: number
}

function roseValues(rose: AspectElevationRose) {
  const bandCount = rose.bands.length
  return rose.cells
    .filter((cell) => cell.count > 0 && cell.band < bandCount)
    .map((cell) => ({
      name: rose.bands[cell.band].label,
      value: [
        roseRadius(cell.band, bandCount),
        ROSE_ANGLE_ORDER.findIndex((aspect) => aspect === cell.aspect),
        cell.count,
      ],
    }))
    .filter((item) => item.value[1] >= 0)
}

function roseSymbol(mode: RoseMode, ring: number, max: number) {
  if (mode === 'numbers') {
    return {
      symbolSize: 1,
      itemStyle: { color: 'transparent' },
      label: {
        show: true,
        position: 'inside',
        color: CHART_BLUE,
        fontSize: 15,
        fontWeight: 'bold',
        formatter: (params: unknown) =>
          isDataItem(params) && Array.isArray(params.value) ? String(params.value[2]) : '',
      },
    }
  }
  return {
    symbolSize: (value: unknown) =>
      Array.isArray(value) && typeof value[2] === 'number'
        ? circleDiameter(value[2], max, ring)
        : 0,
    itemStyle: { color: CHART_BLUE, opacity: 0.75 },
    label: { show: false },
  }
}

/**
 * The rose: eight aspects around, elevation bands out from the centre with the highest innermost,
 * and a count in each cell as a circle sized to it or as the number itself.
 */
export function roseChartOption(
  rose: AspectElevationRose,
  { mode, height, title }: RoseChartOptions,
): EChartOption {
  const bandCount = rose.bands.length
  const data = roseValues(rose)
  const max = Math.max(1, ...data.map((item) => item.value[2]))
  // The polar area is 80% of the chart's half-height; a ring is its share of that.
  const ring = ((height / 2) * 0.8) / (bandCount + 1)
  return {
    animation: false,
    title: titleOption(title),
    tooltip: { ...TOOLTIP_BASE, trigger: 'item', formatter: itemTooltip },
    polar: { radius: ['0%', '80%'], center: ['50%', title === undefined ? '50%' : '53%'] },
    angleAxis: {
      type: 'category',
      data: [...ROSE_ANGLE_ORDER],
      startAngle: ROSE_START_ANGLE,
      boundaryGap: true,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: ROSE_GRID_COLOR } },
      axisLabel: { color: ROSE_LABEL_COLOR, fontSize: 15, margin: 10 },
    },
    radiusAxis: {
      type: 'value',
      min: 0,
      max: bandCount + 1,
      interval: 1,
      z: 10,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: ROSE_GRID_COLOR } },
      axisLabel: {
        color: '#1E2326',
        fontSize: 13,
        fontWeight: 'bold',
        showMinLabel: true,
        formatter: (value: number) => roseEdgeLabel(value, rose.bands),
      },
    },
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'polar',
        cursor: 'default',
        ...roseSymbol(mode, ring, max),
        emphasis: { scale: false },
        data,
      },
    ],
  }
}

/** "417 avalanches within map area", the widget's count line over its charts. */
export function statsCountLine(total: number, scope: CountScope): string {
  return `${total} ${total === 1 ? 'avalanche' : 'avalanches'} ${scopeText(scope)}`
}

/** Whether a breakdown has anything to draw. */
export function hasCounts(items: { count: number }[]): boolean {
  return items.some((item) => item.count > 0)
}

export function hasBucketCounts<K extends string>(buckets: StatsBucket<K>[]): boolean {
  return buckets.some((bucket) => Object.values<number>(bucket.counts).some((count) => count > 0))
}
