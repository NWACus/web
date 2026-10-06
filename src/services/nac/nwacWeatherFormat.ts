/** How Mountain Weather values read on the page, matching the dashboard preview. Pure. */
import type {
  NWACWeatherBlock,
  NWACWeatherGridName,
  NWACWeatherIssuance,
  NWACWeatherPeriod,
  NWACWeatherSection,
} from './model/nwacWeather'

export const DASH = '—'

/** Snow level = freezing level − drop; the drop defaults to 1,000 ft. */
export const DEFAULT_DROP_FT = 1000

/**
 * New snow in inches from water equivalent and snow-to-liquid ratio (density 10 → 10:1). A dry
 * period is QPF 0 with no density, and reads as 0 snow rather than a gap.
 */
export function deriveSnow(qpf: number | null | undefined, density: number | null | undefined) {
  if (qpf == null) return null
  if (qpf === 0) return 0
  if (density == null || density <= 0) return null
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

/** Each level's shade, 0–3, relative to its row: a fixed scale would paint one day flat. */
export function snowLevelTones(levels: (number | null)[]): (number | null)[] {
  const known = levels.filter((l): l is number => l != null)
  if (known.length === 0) return levels.map(() => null)
  const lo = Math.min(...known)
  const hi = Math.max(...known)
  return levels.map((l) => {
    if (l == null) return null
    return hi === lo ? 0 : Math.round(((l - lo) / (hi - lo)) * 3)
  })
}

/** An axis's slots in the forecast's own order; a key with no definition has nothing to draw. */
function onAxis<Slot extends { key: string }>(slots: Slot[], keys: string[]): Slot[] {
  return keys.flatMap((key) => slots.find((s) => s.key === key) ?? [])
}

// The columns each grid covers come from the forecast (`axes`), never from which cells are full.
export function precipPeriods(issuance: NWACWeatherIssuance): NWACWeatherPeriod[] {
  return onAxis(issuance.periods, issuance.axes.precipPeriods)
}

export function tempPeriods(issuance: NWACWeatherIssuance): NWACWeatherPeriod[] {
  return onAxis(issuance.periods, issuance.axes.tempPeriods)
}

export function windBlocks(issuance: NWACWeatherIssuance): NWACWeatherBlock[] {
  return onAxis(issuance.blocks, issuance.axes.windBlocks)
}

export function snowLevelBlocks(issuance: NWACWeatherIssuance): NWACWeatherBlock[] {
  return onAxis(issuance.blocks, issuance.axes.snowLevelBlocks)
}

/** The template's section for a grid; undefined when the format has none. */
export function sectionFor(
  issuance: NWACWeatherIssuance,
  grid: NWACWeatherGridName,
): NWACWeatherSection | undefined {
  return issuance.sections.find((s) => s.grid === grid)
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
