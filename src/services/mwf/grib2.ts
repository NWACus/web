// GRIB2 QPF model driver — TypeScript port of products-api's mwf_qpf.py
// grib2 path, decoding with @azohra/meteo.grib (pure TS, no native deps).
//
// The whole flow is driven by the model row's Settings config, exactly like
// the Python original:
//  - cycle selection: probe the sentinel forecast hour's `.idx` for each
//    candidate cycle newest-first, fall back to the oldest candidate
//  - record matching: an explicit `recordMatch` template (tokens {fh}
//    {fhPrev}) or the derived `<variable>:<level>:<fh-window>-<fh> hour acc
//    fcst`, matched as a substring of the raw `.idx` line, minus `exclude`
//    substrings (NBM lists deterministic + probabilistic APCP on the same
//    variable/level — the exclude list is how config picks one)
//  - byte-range fetch of just the matched record (206 required — a 200 means
//    the server ignored Range and sent the whole multi-GB file)
//  - decode + nearest-gridpoint sampling, with the grid geometry and
//    per-point indexes cached per model so only the first record pays the
//    nearest-point search
//  - hourly accumulations summed into the four 12h periods; a record is
//    labeled by its END hour — fh=7 is the 6–7h total — so placement is
//    `(startHour, endHour]` (review finding in the original: `[start, end)`
//    summed one hour early)
//  - units: `toInches` (mm→in shorthand) or a numeric `scale` multiplier;
//    an unconvertible declaration throws rather than passing raw values
//    through looking healthy
//
// Per-hour fetch/decode failures skip the hour but are collected into
// `errors` so the artifact can surface template drift loudly instead of
// showing a quietly thinner column.
import {
  decodeFieldValues,
  nearestGridpoint,
  parseFields,
  parseGrid,
  splitMessages,
} from '@azohra/meteo.grib'
import { candidateCycles, validateOutboundUrl } from './guidance'

export const GRIB_CYCLE_HOURS: readonly number[] = [0, 6, 12, 18]

// Period hour windows relative to the model cycle (products-api defaults):
// four 12h periods anchored at Night 1 = cycle+6h..cycle+18h.
export const GRIB_DEFAULT_PERIODS = [
  { id: 'night1', label: 'Night 1', startHour: 6, endHour: 18 },
  { id: 'day2', label: 'Day 2', startHour: 18, endHour: 30 },
  { id: 'night2', label: 'Night 2', startHour: 30, endHour: 42 },
  { id: 'day3', label: 'Day 3', startHour: 42, endHour: 54 },
] as const

export interface GribPeriod {
  id: string
  startHour: number
  endHour: number
}

export interface Grib2Point {
  code: string
  lat: number
  lng: number
}

export interface Grib2ModelConfig {
  variable?: string
  level?: string
  accumulation?: string
  recordMatch?: string
  exclude?: unknown[]
  recordExclude?: unknown[]
  forecastHours?: { start?: number; end?: number }
  cycleHours?: number[]
  units?: string
  toInches?: boolean
  scale?: number
}

// Same forgiving parse as guidance.ts's parseModelConfig (Settings stores the
// config as a JSON string), typed to the grib2 config surface.
export function parseGrib2Config(raw: unknown): Grib2ModelConfig {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch {
      return {}
    }
  }
  return {}
}

// --- Pure helpers -----------------------------------------------------------

// Resolve a grib2 URL template's tokens: {date} YYYYMMDD, {cycle} HH, and the
// forecast hour as {fh03} / {fh02} / {fh}.
export function fillGribUrl(template: string, cycle: Date, fh: number): string {
  const pad = (n: number, w: number) => String(n).padStart(w, '0')
  const date = `${cycle.getUTCFullYear()}${pad(cycle.getUTCMonth() + 1, 2)}${pad(cycle.getUTCDate(), 2)}`
  return template
    .replaceAll('{date}', date)
    .replaceAll('{cycle}', pad(cycle.getUTCHours(), 2))
    .replaceAll('{fh03}', pad(fh, 3))
    .replaceAll('{fh02}', pad(fh, 2))
    .replaceAll('{fh}', String(fh))
}

// Resolve a record-match template's tokens. {fhPrev} must be replaced first —
// it contains '{fh}' as a substring.
export function fillMatch(template: string, fh: number): string {
  return template.replaceAll('{fhPrev}', String(fh - 1)).replaceAll('{fh}', String(fh))
}

// Accumulation window in hours: 'hourly' → 1, 'window:N' → N. Any other mode
// throws: a cumulative-since-run mode silently read as hourly would select
// and sum the WRONG precipitation records (review finding in the original).
export function matchWindow(accumulation: string | undefined | null): number {
  if (accumulation == null || accumulation === 'hourly') return 1
  if (accumulation.startsWith('window:')) {
    const n = Number(accumulation.slice('window:'.length))
    if (!Number.isInteger(n)) {
      throw new Error(`invalid accumulation window '${accumulation}' — use 'window:N'`)
    }
    return Math.max(1, n)
  }
  throw new Error(
    `accumulation mode '${accumulation}' is not supported — use 'hourly' or 'window:N'`,
  )
}

// The `.idx` substring to match: explicit `recordMatch` wins, else derived
// from variable/level + the accumulation window.
export function deriveMatch(cfg: Grib2ModelConfig, fh: number, window: number): string {
  if (cfg.recordMatch) return fillMatch(cfg.recordMatch, fh)
  const variable = cfg.variable ?? 'APCP'
  const level = cfg.level ?? 'surface'
  return `${variable}:${level}:${fh - window}-${fh} hour acc fcst`
}

// Whether forecast hour `fh` falls in `period`: accumulation records place by
// their END hour, so the window is `(startHour, endHour]`.
export function inPeriod(fh: number, period: GribPeriod): boolean {
  return period.startHour < fh && fh <= period.endHour
}

export function excludeList(cfg: Grib2ModelConfig): string[] {
  return (cfg.exclude ?? cfg.recordExclude ?? []).map((x) => String(x).toLowerCase())
}

// Raw values are DIVIDED by this before display. A numeric `scale`
// (multiplier) wins when set; else the mm→inches shorthand. An unconvertible
// declaration throws — surfaced as an error status — rather than passing raw
// values through looking healthy.
export function sourceDivisor(cfg: Grib2ModelConfig): number {
  if (cfg.scale != null) {
    const scale = Number(cfg.scale)
    if (!Number.isFinite(scale) || scale === 0) throw new Error('scale must be a non-zero number')
    return 1 / scale
  }
  if (cfg.toInches) {
    if (cfg.units !== 'mm') {
      throw new Error(
        `toInches supports units 'mm' only (got '${cfg.units}'); use 'scale' for other conversions`,
      )
    }
    return 25.4
  }
  return 1
}

// --- .idx parsing -----------------------------------------------------------

export interface IdxLine {
  offset: number
  line: string
}

// Parse raw `.idx` text into (offset, line) records, skipping malformed
// lines. Matching stays on the RAW line — that's the config contract
// (`recordMatch` / `exclude` are substrings of what NCEP publishes).
export function parseIdxText(text: string): IdxLine[] {
  const records: IdxLine[] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const parts = line.split(':')
    if (parts.length < 3) continue
    const offset = Number(parts[1])
    if (!Number.isInteger(offset) || !/^\d+$/.test(parts[0])) continue
    records.push({ offset, line })
  }
  return records
}

// Inclusive HTTP Range for record `index`; open-ended for the file's last.
export function recordRange(records: IdxLine[], index: number): string {
  const start = records[index].offset
  const next = records[index + 1]
  return next ? `bytes=${start}-${next.offset - 1}` : `bytes=${start}-`
}

export function findRecordIndex(
  records: IdxLine[],
  target: string,
  exclude: string[],
): number | null {
  const found = records.findIndex(
    (r) => r.line.includes(target) && !exclude.some((x) => r.line.toLowerCase().includes(x)),
  )
  return found === -1 ? null : found
}

// --- HTTP seam --------------------------------------------------------------

// Minimal injected fetch (the shape of a WHATWG fetch Response we read).
export type Grib2Fetch = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{ status: number; text(): Promise<string>; arrayBuffer(): Promise<ArrayBuffer> }>

export const defaultGrib2Fetch: Grib2Fetch = async (url, init) => {
  validateOutboundUrl(url)
  return fetch(url, {
    headers: init?.headers,
    signal: AbortSignal.timeout(40_000),
    cache: 'no-store',
  })
}

async function fetchIdx(fetchImpl: Grib2Fetch, url: string): Promise<IdxLine[]> {
  try {
    const res = await fetchImpl(`${url}.idx`)
    if (res.status !== 200) return []
    return parseIdxText(await res.text())
  } catch {
    return []
  }
}

async function idxAvailable(fetchImpl: Grib2Fetch, url: string): Promise<boolean> {
  try {
    const res = await fetchImpl(`${url}.idx`)
    return res.status === 200 && (await res.text()).trim().length > 0
  } catch {
    return false
  }
}

async function fetchRecordBytes(
  fetchImpl: Grib2Fetch,
  url: string,
  range: string,
): Promise<Uint8Array> {
  const res = await fetchImpl(url, { headers: { Range: range } })
  // Only 206 is success: a 200 means the server ignored Range and would hand
  // back the whole multi-GB file.
  if (res.status !== 206) throw new Error(`expected 206 for ranged read, got ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

// --- Cycle selection --------------------------------------------------------

// Newest candidate cycle whose sentinel-fh `.idx` exists; falls back to the
// oldest candidate so a build attempt still names a concrete cycle.
export async function selectCycle(
  fetchImpl: Grib2Fetch,
  urlTemplate: string,
  cycleHours: readonly number[],
  sentinelFh: number,
  now: Date,
): Promise<Date> {
  const candidates = candidateCycles(now, cycleHours)
  for (const cycle of candidates) {
    if (await idxAvailable(fetchImpl, fillGribUrl(urlTemplate, cycle, sentinelFh))) return cycle
  }
  return candidates[candidates.length - 1]
}

// --- Grid sampling ----------------------------------------------------------

// Per-model cache: the nearest-gridpoint index per point code, validated by
// the grid's section-3 hash so a mid-build geometry change recomputes.
export interface GridCacheEntry {
  gridKey: string
  indexes: Map<string, number>
}

export type Grib2GridCache = Map<string, GridCacheEntry>

// Decode one record's bytes and sample the nearest gridpoint to each point.
// Points the grid marks missing are omitted (a 9999 missing sentinel summed
// into a period would be catastrophic, not conservative).
export function extractPointValues(
  bytes: Uint8Array,
  points: Grib2Point[],
  gridCache: Grib2GridCache,
  cacheKey: string,
  divisor: number,
): Record<string, number> {
  const [field] = parseFields(splitMessages(bytes)[0])
  const grid = parseGrid(field.section3)
  let entry = gridCache.get(cacheKey)
  if (!entry || entry.gridKey !== grid.gridKey) {
    const indexes = new Map<string, number>()
    for (const point of points) {
      if (point.lat == null || point.lng == null) continue
      indexes.set(point.code, nearestGridpoint(grid, point.lat, point.lng).index)
    }
    entry = { gridKey: grid.gridKey, indexes }
    gridCache.set(cacheKey, entry)
  }
  const { values, missingMask } = decodeFieldValues(field)
  const out: Record<string, number> = {}
  for (const [code, index] of entry.indexes) {
    if (missingMask?.[index]) continue
    const value = values[index] / divisor
    if (Number.isFinite(value)) out[code] = value
  }
  return out
}

// --- Model builder ----------------------------------------------------------

export interface Grib2ModelResult {
  cycle: Date
  totals: Record<string, Record<string, number>>
  availableHours: number[]
  /** Per-hour fetch/decode failures — hours were skipped, not silently fine. */
  errors: string[]
}

export async function buildGrib2Model(
  fetchImpl: Grib2Fetch,
  model: { url: string; config?: unknown },
  points: Grib2Point[],
  periods: readonly GribPeriod[],
  gridCache: Grib2GridCache,
  now: Date,
): Promise<Grib2ModelResult> {
  const cfg = parseGrib2Config(model.config)
  const start = Math.trunc(cfg.forecastHours?.start ?? 6)
  const end = Math.trunc(cfg.forecastHours?.end ?? 48)
  const window = matchWindow(cfg.accumulation ?? 'hourly')
  const exclude = excludeList(cfg)
  const divisor = sourceDivisor(cfg)

  const cycle = await selectCycle(
    fetchImpl,
    model.url,
    cfg.cycleHours?.length ? cfg.cycleHours : GRIB_CYCLE_HOURS,
    start,
    now,
  )

  const totals: Record<string, Record<string, number>> = {}
  for (const period of periods) totals[period.id] = {}
  const availableHours: number[] = []
  const errors: string[] = []

  for (let fh = start; fh <= end; fh += window) {
    const url = fillGribUrl(model.url, cycle, fh)
    const records = await fetchIdx(fetchImpl, url)
    if (!records.length) continue
    const matchIndex = findRecordIndex(records, deriveMatch(cfg, fh, window), exclude)
    if (matchIndex == null) continue
    let values: Record<string, number>
    try {
      const bytes = await fetchRecordBytes(fetchImpl, url, recordRange(records, matchIndex))
      values = extractPointValues(bytes, points, gridCache, model.url, divisor)
    } catch (error) {
      errors.push(
        `f${String(fh).padStart(2, '0')}: ${error instanceof Error ? error.message : String(error)}`,
      )
      continue
    }
    availableHours.push(fh)
    for (const period of periods) {
      if (!inPeriod(fh, period)) continue
      for (const [code, amount] of Object.entries(values)) {
        totals[period.id][code] = (totals[period.id][code] ?? 0) + amount
      }
    }
  }

  return { cycle, totals, availableHours, errors }
}
