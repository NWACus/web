/** How Mountain Weather values read on the page, matching the dashboard preview. Pure. */
import type {
  NWACWeatherBlock,
  NWACWeatherGrid,
  NWACWeatherIssuance,
  NWACWeatherPeriod,
} from './model/nwacWeather'

export const DASH = '—'

/** A zone's period is wet when any of its stations forecasts this much or more (inches). */
export const WET_QPF_IN = 0.01

/**
 * Whether a block's level is a snow level or a freezing level, as the dashboard decides it: the
 * forecaster's pick when they made one, else snow when the zone's period is wet.
 */
export function levelKind(
  issuance: NWACWeatherIssuance,
  zoneId: string,
  block: NWACWeatherBlock,
): 'snow' | 'freezing' {
  const mode = issuance.snowLevel[zoneId]?.[block.key]?.mode
  if (mode === 'snow' || mode === 'freezing') return mode
  const period = block.period
  const wet =
    period != null &&
    issuance.points.some(
      (p) => p.zoneId === zoneId && (issuance.precip[p.code]?.[period]?.qpf ?? 0) >= WET_QPF_IN,
    )
  return wet ? 'snow' : 'freezing'
}

/** Up or down from the level before; null for the first, an unknown or an unchanged one. */
export type LevelTrend = 'up' | 'down' | null

export function levelTrend(before: number | null | undefined, level: number | null): LevelTrend {
  if (before == null || level == null || before === level) return null
  return level > before ? 'up' : 'down'
}

/** Snow level = freezing level − drop; the drop defaults to 1,000 ft. */
export const DEFAULT_DROP_FT = 1000

/** New snow in inches from water equivalent and snow-to-liquid ratio (density 10 → 10:1). */
export function deriveSnow(qpf: number | null | undefined, density: number | null | undefined) {
  if (qpf == null || density == null || density <= 0) return null
  return Math.round(((qpf * 100) / density) * 10) / 10
}

export function deriveSnowLevel(
  freezing: number | null | undefined,
  drop: number | null | undefined,
) {
  if (freezing == null) return null
  return Math.max(0, freezing - (drop ?? DEFAULT_DROP_FT))
}

/** Whole inches; under half an inch reads 0 rather than a trace mark. */
export function fmtSnowAmount(snow: number | null): string {
  if (snow == null) return DASH
  if (snow < 0.5) return '0'
  return `${Math.round(snow)}"`
}

/**
 * Water equivalent in inches, as the legacy nwac.us precipitation table printed it: none as 0, a
 * trace as "LT 0.10", otherwise two decimals.
 */
export function fmtQpf(qpf: number | null | undefined): string {
  if (qpf == null) return DASH
  if (qpf <= 0) return '0'
  if (qpf < 0.1) return 'LT 0.10'
  return qpf.toFixed(2)
}

export function fmtWind(cell: { dir: string | null; speed: number | null } | undefined) {
  if (cell?.speed == null) return DASH
  if (cell.speed === 0) return 'Calm'
  return `${cell.dir ?? ''} ${cell.speed}`.trim()
}

const COMPASS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
]

/** Degrees a compass point's wind blows from; null for variable, blank or unknown directions. */
export function windBearing(dir: string | null | undefined): number | null {
  const i = dir ? COMPASS.indexOf(dir.trim().toUpperCase()) : -1
  return i < 0 ? null : i * 22.5
}

/** The periods the issuance forecasts precipitation for. */
export function precipPeriods(issuance: NWACWeatherIssuance): NWACWeatherPeriod[] {
  return issuance.periods.filter((p) => p.precip)
}

/** The 6h blocks with a value for any zone, else the whole window; the wire doesn't say. */
export function blocksWithData<Cell>(
  issuance: NWACWeatherIssuance,
  grid: NWACWeatherGrid<Cell>,
  hasValue: (cell: Cell) => boolean,
): NWACWeatherBlock[] {
  const used = new Set<string>()
  for (const cells of Object.values(grid)) {
    for (const [key, cell] of Object.entries(cells)) if (hasValue(cell)) used.add(key)
  }
  const shown = issuance.blocks.filter((b) => used.has(b.key))
  return shown.length ? shown : issuance.blocks
}

export function windBlocks(issuance: NWACWeatherIssuance): NWACWeatherBlock[] {
  return blocksWithData(issuance, issuance.wind, (c) => c.speed != null)
}

export function snowLevelBlocks(issuance: NWACWeatherIssuance): NWACWeatherBlock[] {
  return blocksWithData(issuance, issuance.snowLevel, (c) => c.freezing != null)
}

/** The periods a 12h table shows: those with a value for any zone, else the whole window. */
export function tempPeriods(issuance: NWACWeatherIssuance): NWACWeatherPeriod[] {
  const used = new Set<string>()
  for (const cells of Object.values(issuance.temp)) {
    for (const [key, cell] of Object.entries(cells)) if (cell.high != null) used.add(key)
  }
  const shown = issuance.periods.filter((p) => used.has(p.key))
  return shown.length ? shown : issuance.periods
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Mon Sep 14" for a `YYYY-MM-DD` calendar date. */
export function fmtCalendarDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd)
  if (!m) return ymd
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`
}

export const SENSIBLE_SLOTS = [
  { key: 'morning', label: 'Today / Tonight' },
  { key: 'afternoon', label: 'Tomorrow' },
] as const

export function issuanceLabel(type: NWACWeatherIssuance['type']): string {
  return type === 'morning' ? 'Morning Forecast' : 'Afternoon Forecast'
}

export function issuanceShortLabel(type: NWACWeatherIssuance['type']): string {
  return type === 'morning' ? 'Morning' : 'Afternoon'
}

/** Periods grouped by calendar date, for the By Zone header. */
export function periodDateGroups(periods: NWACWeatherPeriod[]): { date: string; span: number }[] {
  const out: { date: string; span: number }[] = []
  for (const p of periods) {
    const last = out[out.length - 1]
    if (last && last.date === p.date) last.span++
    else out.push({ date: p.date, span: 1 })
  }
  return out
}

/** The date a 6h block falls on, via its parent period. */
export function blockDate(issuance: NWACWeatherIssuance, block: NWACWeatherBlock): string | null {
  return issuance.periods.find((p) => p.key === block.period)?.date ?? null
}

/** A zone's snow for one period: the mean over its points, printed in 2-inch bands. */
export function rangeBucket(value: number | null, step = 2): string {
  if (value == null) return DASH
  if (value <= 0) return '0'
  const lo = Math.floor(value / step) * step
  return `${lo}–${lo + step}"`
}

/** One point's snow for one period, from its water amount and density. */
export function pointSnow(
  issuance: NWACWeatherIssuance,
  pointCode: string,
  periodKey: string,
): number | null {
  const cell = issuance.precip[pointCode]?.[periodKey]
  return deriveSnow(cell?.qpf, cell?.density)
}

/** The points that forecast a zone's snow, in the issuance's order. */
export function zonePoints(issuance: NWACWeatherIssuance, zoneId: string) {
  return issuance.points.filter((p) => p.zoneId === zoneId)
}

export function zoneSnow(
  issuance: NWACWeatherIssuance,
  zoneId: string,
  periodKey: string,
): number | null {
  const snows = zonePoints(issuance, zoneId)
    .map((p) => pointSnow(issuance, p.code, periodKey))
    .filter((s): s is number => s != null)
  if (snows.length === 0) return null
  return Math.round((snows.reduce((a, b) => a + b, 0) / snows.length) * 10) / 10
}

/** The zones an issuance measured, narrowed to one avalanche zone when the page has one. */
export function zonesFor(issuance: NWACWeatherIssuance, avalancheZoneId?: number | null) {
  if (avalancheZoneId == null) return issuance.zones
  const match = issuance.zones.filter((z) => z.avalancheZoneId === avalancheZoneId)
  return match
}
