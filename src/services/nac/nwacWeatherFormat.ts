/**
 * Read-side rules for the Mountain Weather Forecast: how an entered value reads on the page. Pure
 * functions over the model; unit-tested. Mirrors the AFP dashboard's preview and the legacy
 * nwac.us tables, so the public page prints what the forecaster previewed.
 */
import type {
  NwacWeatherBlock,
  NwacWeatherGrid,
  NwacWeatherIssuance,
  NwacWeatherLevelCell,
  NwacWeatherPeriod,
} from './model/nwacWeather'

export const DASH = '—'

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

export function fmtTemp(cell: { high: number | null; low: number | null } | undefined) {
  if (cell?.high == null || cell?.low == null) return DASH
  return `${cell.high} / ${cell.low}`
}

export function fmtSnowLevel(cell: NwacWeatherLevelCell | undefined) {
  const level = deriveSnowLevel(cell?.freezing, cell?.drop)
  return level == null ? DASH : `${level.toLocaleString('en-US')}'`
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

/**
 * Each level's shade, 0 (lowest) to 3 (highest), relative to the other levels in the same row:
 * snow levels span sea level to 12,000 ft over a season, so a fixed scale would paint one day flat.
 */
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

/** A zone's snow for one period: the mean over its points, printed in 2-inch bands. */
export function rangeBucket(value: number | null, step = 2): string {
  if (value == null) return DASH
  if (value <= 0) return '0'
  const lo = Math.floor(value / step) * step
  return `${lo}–${lo + step}"`
}

export function zoneSnow(
  issuance: NwacWeatherIssuance,
  zoneId: string,
  periodKey: string,
): number | null {
  const snows = issuance.points
    .filter((p) => p.zoneId === zoneId)
    .map((p) => {
      const cell = issuance.precip[p.code]?.[periodKey]
      return deriveSnow(cell?.qpf, cell?.density)
    })
    .filter((s): s is number => s != null)
  if (snows.length === 0) return null
  return Math.round((snows.reduce((a, b) => a + b, 0) / snows.length) * 10) / 10
}

/** The periods the issuance forecasts precipitation for. */
export function precipPeriods(issuance: NwacWeatherIssuance): NwacWeatherPeriod[] {
  return issuance.periods.filter((p) => p.precip)
}

/**
 * The columns a 6h table shows: the issuance's blocks that carry a value for any zone. The wire
 * doesn't say which blocks a table covers (wind runs one day, snow level six or eight blocks),
 * so the data decides — and an issuance with nothing entered falls back to its whole window.
 */
export function blocksWithData<Cell>(
  issuance: NwacWeatherIssuance,
  grid: NwacWeatherGrid<Cell>,
  hasValue: (cell: Cell) => boolean,
): NwacWeatherBlock[] {
  const used = new Set<string>()
  for (const cells of Object.values(grid)) {
    for (const [key, cell] of Object.entries(cells)) if (hasValue(cell)) used.add(key)
  }
  const shown = issuance.blocks.filter((b) => used.has(b.key))
  return shown.length ? shown : issuance.blocks
}

export function windBlocks(issuance: NwacWeatherIssuance): NwacWeatherBlock[] {
  return blocksWithData(issuance, issuance.wind, (c) => c.speed != null)
}

export function snowLevelBlocks(issuance: NwacWeatherIssuance): NwacWeatherBlock[] {
  return blocksWithData(issuance, issuance.snowLevel, (c) => c.freezing != null)
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Mon Sep 14" for a `YYYY-MM-DD`; a calendar date, so no timezone applies. */
export function fmtCalendarDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd)
  if (!m) return ymd
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`
}

/** Periods grouped by calendar date, for the By Zone header. */
export function periodDateGroups(periods: NwacWeatherPeriod[]): { date: string; span: number }[] {
  const out: { date: string; span: number }[] = []
  for (const p of periods) {
    const last = out[out.length - 1]
    if (last && last.date === p.date) last.span++
    else out.push({ date: p.date, span: 1 })
  }
  return out
}

/** The date a 6h block falls on, via its parent period. */
export function blockDate(issuance: NwacWeatherIssuance, block: NwacWeatherBlock): string | null {
  return issuance.periods.find((p) => p.key === block.period)?.date ?? null
}

/** The zones an issuance measured, narrowed to one avalanche zone when the page has one. */
export function zonesFor(issuance: NwacWeatherIssuance, avalancheZoneId?: number | null) {
  if (avalancheZoneId == null) return issuance.zones
  const match = issuance.zones.filter((z) => z.avalancheZoneId === avalancheZoneId)
  return match
}
