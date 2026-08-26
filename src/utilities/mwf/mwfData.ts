// Pure forecast model + helpers for the Mountain Weather Forecast (MWF).
// Direct TypeScript port of dashboard-v2's app/components/forecaster/mwfData.js
// (branch feat/mwf-form), kept behavior-identical so its test suite runs here
// as a parity baseline, then updated for dashboard-v2 PR #158: the morning
// issuance runs through Night 2, the morning default issue time is 7am, and
// over-precise QPF entries are flagged at publish.
//
// This module is pure — no Payload, no fetch, no Date.now() side effects
// beyond the explicit `now` defaults — and is imported by both the editor and
// the server tests. The period/block structure is the fixed MWF product shape
// shared by every center; per-center content (zones, points, models, extended
// zones) arrives as arguments shaped by the tenant's Settings mwf group.

export type IssuanceType = 'morning' | 'afternoon'

export interface Period {
  key: string
  label: string
  short: string
  dayOffset: number
  kind: 'day' | 'night'
}

export interface Block {
  key: string
  label: string
  period: string
}

export interface ExtendedBlock {
  key: string
  label: string
  dayOffset: number
  part: 'Morning' | 'Day' | 'Night'
}

// A zone as the forecast body keys it: `id` is the canonical slug the cells,
// extended-zone config, and public render all reference.
export interface Zone {
  id: string
  name: string
}

export interface ForecastPoint {
  code: string
  name: string
  zone: string
  lat: number | null
  lng: number | null
}

// Entered values pass through HTML inputs, so a cell may hold a number, a
// not-yet-parsed string, '' (cleared) or null (never entered).
export type Entered = number | string | null

export interface PrecipCell {
  qpf: Entered
  density: Entered
  guidance: Record<string, number>
}

export interface TempsCell {
  high: Entered
  low: Entered
  guidance: Record<string, { high: number; low: number }>
}

export interface SnowLevelCell {
  freezing: Entered
  drop: Entered
  // 'auto' derives snow-vs-freezing from the zone's QPF; an explicit value is
  // the forecaster's override.
  mode: 'auto' | 'snow' | 'freezing'
}

export interface WindCell {
  dir: string
  speed: Entered
  guidance: Record<string, { speed: number; dir: string }>
}

export interface SensibleSlots {
  morning: string
  afternoon: string
}

export interface ForecastMeta {
  type: IssuanceType
  author: string
  issued: string
  initialDate: string
}

type CellTable<C> = Record<string, Record<string, C>>

// Values hydrated from a stored body whose cells the current config no longer
// has (a retired point or zone). Stashed rather than discarded, and merged
// back at serialize time, so correcting an older forecast doesn't silently
// publish them away (PR #158 final).
export interface PreservedCells {
  precip: CellTable<{ qpf: Entered; density: Entered }>
  temps: CellTable<{ high: Entered; low: Entered }>
  wind: CellTable<{ dir: string; speed: Entered }>
  snowLevel: CellTable<{ freezing: Entered; drop: Entered; mode: SnowLevelCell['mode'] }>
  extendedSnowLevel: CellTable<{ freezing: Entered; drop: Entered; mode: SnowLevelCell['mode'] }>
  sensible: Record<string, SensibleSlots>
}

export function emptyPreserved(): PreservedCells {
  return { precip: {}, temps: {}, wind: {}, snowLevel: {}, extendedSnowLevel: {}, sensible: {} }
}

export interface MwfForecast {
  meta: ForecastMeta
  precip: CellTable<PrecipCell>
  snowLevel: CellTable<SnowLevelCell>
  extendedSnowLevel: CellTable<SnowLevelCell>
  temps: CellTable<TempsCell>
  wind: CellTable<WindCell>
  sensible: Record<string, SensibleSlots>
  discussion: { synopsis: string; extended: string }
  preserved?: PreservedCells
}

// The persisted body: entered values only, guidance stripped (re-overlaid live).
export interface SerializedForecast {
  meta: ForecastMeta
  precip: CellTable<{ qpf: Entered; density: Entered }>
  temps: CellTable<{ high: Entered; low: Entered }>
  wind: CellTable<{ dir: string; speed: Entered }>
  snowLevel: CellTable<{ freezing: Entered; drop: Entered; mode: SnowLevelCell['mode'] }>
  extendedSnowLevel: CellTable<{ freezing: Entered; drop: Entered; mode: SnowLevelCell['mode'] }>
  sensible: Record<string, SensibleSlots>
  discussion: { synopsis: string; extended: string }
}

export interface MissingField {
  section: string
  where: string
  field: string
}

// --- 12-hour periods — QPF / Density / Snow / Temps ------------------------
// Master sequence Day 1 → Day 3. A morning issuance covers Day 1 → Night 2; an
// afternoon issuance shifts a half-day to Night 1 → Day 3 (see periodsFor).
// `dayOffset` = calendar days after issuance the period falls on (a day and its
// following night share a date); `kind` distinguishes day vs night.
export const PERIODS: Period[] = [
  { key: 'd1', label: 'Day 1', short: 'D1', dayOffset: 0, kind: 'day' },
  { key: 'n1', label: 'Night 1', short: 'N1', dayOffset: 0, kind: 'night' },
  { key: 'd2', label: 'Day 2', short: 'D2', dayOffset: 1, kind: 'day' },
  { key: 'n2', label: 'Night 2', short: 'N2', dayOffset: 1, kind: 'night' },
  { key: 'd3', label: 'Day 3', short: 'D3', dayOffset: 2, kind: 'day' },
]

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Parse a "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" string to a LOCAL date (a bare
// date via `new Date(str)` would be UTC midnight → off-by-one west of UTC).
function parseLocalDate(s: string | undefined | null): Date {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = s ? new Date(s) : new Date()
  return Number.isNaN(d.getTime()) ? new Date() : d
}

// Calendar date label ("Sun Jun 28") for a period `dayOffset` days after the
// anchor date (Day 1). `base` is the forecast's initialDate.
export function periodDate(base: string, dayOffset = 0): string {
  const b = parseLocalDate(base)
  const d = new Date(b.getFullYear(), b.getMonth(), b.getDate() + (dayOffset || 0))
  return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`
}

// --- 6-hour blocks — Snow level / Freezing / Wind -------------------------
// Master sequence Day 1 → Day 3 (two blocks per 12h period: AM/PM for days,
// Eve/Night for nights). Each block maps up to the 12h period it falls within
// (for QPF-driven snow-vs-freezing color coding). Sliced per issuance below.
export const BLOCKS: Block[] = [
  { key: 'am1', label: 'AM 1', period: 'd1' },
  { key: 'pm1', label: 'PM 1', period: 'd1' },
  { key: 'ev1', label: 'Eve 1', period: 'n1' },
  { key: 'nt1', label: 'Night 1', period: 'n1' },
  { key: 'am2', label: 'AM 2', period: 'd2' },
  { key: 'pm2', label: 'PM 2', period: 'd2' },
  { key: 'ev2', label: 'Eve 2', period: 'n2' },
  { key: 'nt2', label: 'Night 2', period: 'n2' },
  { key: 'am3', label: 'AM 3', period: 'd3' },
  { key: 'pm3', label: 'PM 3', period: 'd3' },
]

// --- Forecast length by issuance ------------------------------------------
// Morning covers Day 1 → Night 2 (4 periods — PR #158 extended the AM window
// through Day 2's night); afternoon shifts a half-day to Night 1 → Day 3.
// The 6h blocks track the same window.
export function periodsFor(type: IssuanceType): Period[] {
  return type === 'morning' ? PERIODS.slice(0, 4) : PERIODS.slice(1, 5)
}
export function blocksFor(type: IssuanceType): Block[] {
  // Morning = Day 1 → Night 2 (first 8); afternoon = Night 1 → Day 3 (last 8).
  return type === 'morning' ? BLOCKS.slice(0, 8) : BLOCKS.slice(2, 10)
}

// Temperatures cover the issuance's first two periods — morning is Day 1 /
// Night 1, afternoon is Night 1 / Day 2. The temps table shows these and
// publish requires exactly these (PR #158 final).
export function tempPeriodsFor(type: IssuanceType): Period[] {
  return periodsFor(type).slice(0, 2)
}

// QPF / density / snow run three periods on a morning issuance (the AM
// product forecasts precip through Day 2 only) and four on an afternoon one,
// while the 6h wind blocks still cover the issuance's full window.
export function precipPeriodsFor(type: IssuanceType): Period[] {
  return type === 'morning' ? periodsFor(type).slice(0, 3) : periodsFor(type)
}

// Snow / freezing levels run 6 blocks on a morning issuance and 8 on an
// afternoon one — a morning forecast doesn't carry the second evening and
// night. Wind still uses the issuance's full block list.
export function snowLevelBlocksFor(type: IssuanceType): Block[] {
  const blocks = blocksFor(type)
  return type === 'morning' ? blocks.slice(0, 6) : blocks
}

// --- Extended snow-level outlook (afternoon issuance only) ------------------
// Continues past the main window with a coarsening cadence. Keys parse as
// slot+day for copy-forward re-anchoring, matching the regular block keys.
export const EXTENDED_BLOCKS: ExtendedBlock[] = [
  { key: 'nt3', label: 'Night', dayOffset: 2, part: 'Night' },
  { key: 'am4', label: 'Morning', dayOffset: 3, part: 'Morning' },
  { key: 'nt4', label: 'Night', dayOffset: 3, part: 'Night' },
  { key: 'day5', label: 'Day', dayOffset: 4, part: 'Day' },
]
export function extendedBlocksFor(type: IssuanceType): ExtendedBlock[] {
  return type === 'afternoon' ? EXTENDED_BLOCKS : []
}

export const WIND_DIRECTIONS = [
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
  'VAR',
]

// A typed direction, cleaned up ("sw " → "SW"). Anything that isn't a compass
// point comes back blank rather than being stored — publish validation then
// catches it as a missing direction instead of shipping a typo.
export function normalizeWindDir(value: unknown): string {
  const dir = String(value ?? '')
    .trim()
    .toUpperCase()
  return WIND_DIRECTIONS.includes(dir) ? dir : ''
}

// Snow / freezing levels are entered to the nearest 500 ft, 0–16,000.
export const LEVEL_STEP_FT = 500
export const LEVEL_MAX_FT = 16000
export function snapLevel(v: number | null): number | null {
  if (v == null) return null
  if (!Number.isFinite(v)) return null
  return Math.min(LEVEL_MAX_FT, Math.max(0, Math.round(v / LEVEL_STEP_FT) * LEVEL_STEP_FT))
}

export const SENSIBLE_SLOTS = [
  { key: 'morning', label: 'Today / Tonight' },
  { key: 'afternoon', label: 'Tomorrow' },
] as const

export const DEFAULT_DROP_FT = 1000

// --- Zone identity ---------------------------------------------------------
// Forecast-body zone ids are SLUGS. In AvyWeb the tenant's Settings mwf group
// stores zones with an explicit `code` that IS the id; zoneSlug remains for
// deriving an id from a display name (parity with dashboard-v2's fallback).
export function zoneSlug(name: string): string {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric runs → single hyphen
    .replace(/(^-|-$)/g, '')
}

// --- Derivations ----------------------------------------------------------
// Snow amount is ALWAYS derived, never entered: snow = QPF × 100 / density.
// density is the snow-to-liquid ratio expressed as a percentage (10 → 10:1).
// Returns inches rounded to the nearest tenth, or null when inputs are missing.
export function deriveSnow(qpf: Entered, density: Entered): number | null {
  if (qpf == null || qpf === '' || density == null || density === '' || Number(density) <= 0) {
    return null
  }
  const snow = (Number(qpf) * 100) / Number(density)
  return Math.round(snow * 10) / 10
}

// Snow level = freezing level − drop. Both in feet.
export function deriveSnowLevel(freezing: Entered, drop?: Entered): number | null {
  if (freezing == null || freezing === '') return null
  return Math.max(0, Number(freezing) - Number(drop ?? DEFAULT_DROP_FT))
}

// QPF is forecast in hundredths of an inch; anything finer is almost always a
// typo or a pasted model value, so publish flags it (PR #158).
export function qpfOverPrecise(qpf: Entered): boolean {
  if (qpf == null || qpf === '') return false
  const n = Number(qpf)
  if (!Number.isFinite(n)) return false
  return Math.abs(n * 100 - Math.round(n * 100)) > 1e-9
}

// --- Publish validation -----------------------------------------------------
// Every input the forecaster can SEE for this issuance must be filled before
// publish: QPF per point/period (density too wherever QPF > 0 — dry periods
// need no ratio; over-precise QPF flagged), temps high/low per zone/period,
// freezing + wind dir/speed per zone/block, extended freezing for the
// configured outlook zones (afternoon only), both sensible-weather slots per
// zone, and the discussion. Returns a list of {section, where, field} — empty
// means publishable.
// The discussion fields may carry markup from a rich-text editor (an editor
// the forecaster never typed in still emits '<p></p>'), so emptiness is
// judged on the text content (PR #158 final).
export function blankRichText(value: unknown): boolean {
  if (value == null) return true
  return (
    String(value)
      .replace(/<[^>]*>/g, '') // strip tags
      .replace(/&nbsp;/gi, ' ')
      .trim() === ''
  )
}

export function validateForecast(
  fc: MwfForecast,
  {
    zones = [],
    points = [],
    extendedZones = [],
  }: { zones?: Zone[]; points?: ForecastPoint[]; extendedZones?: Zone[] } = {},
): MissingField[] {
  const missing: MissingField[] = []
  const blank = (v: Entered) => v == null || v === ''
  const push = (section: string, where: string, field: string) =>
    missing.push({ section, where, field })
  const precipPeriods = precipPeriodsFor(fc.meta.type)
  const tempPeriods = tempPeriodsFor(fc.meta.type)
  const blocks = blocksFor(fc.meta.type)
  const snowBlocks = snowLevelBlocksFor(fc.meta.type)

  points.forEach((pt) => {
    precipPeriods.forEach((p) => {
      const c = fc.precip?.[pt.code]?.[p.key]
      if (!c) return
      if (blank(c.qpf)) push('Precip', `${pt.code} ${p.short}`, 'QPF')
      else if (Number(c.qpf) > 0 && blank(c.density)) {
        push('Precip', `${pt.code} ${p.short}`, 'density')
      } else if (qpfOverPrecise(c.qpf)) {
        push('Precip', `${pt.code} ${p.short}`, 'QPF precision')
      }
    })
  })

  zones.forEach((z) => {
    tempPeriods.forEach((p) => {
      const c = fc.temps?.[z.id]?.[p.key]
      if (!c) return
      if (blank(c.high)) push('Temps', `${z.name} ${p.short}`, 'high')
      if (blank(c.low)) push('Temps', `${z.name} ${p.short}`, 'low')
      if (!blank(c.high) && !blank(c.low) && Number(c.high) < Number(c.low)) {
        push('Temps', `${z.name} ${p.short}`, 'high below low')
      }
    })
    snowBlocks.forEach((b) => {
      const sl = fc.snowLevel?.[z.id]?.[b.key]
      if (sl && blank(sl.freezing)) push('Snow/Freezing', `${z.name} ${b.label}`, 'level')
    })
    blocks.forEach((b) => {
      const w = fc.wind?.[z.id]?.[b.key]
      if (w) {
        if (blank(w.dir)) push('Wind', `${z.name} ${b.label}`, 'direction')
        if (blank(w.speed)) push('Wind', `${z.name} ${b.label}`, 'speed')
      }
    })
    const sens = fc.sensible?.[z.id]
    SENSIBLE_SLOTS.forEach((slot) => {
      if (sens && blank(sens[slot.key])) push('Sensible weather', `${z.name}`, slot.label)
    })
  })

  extendedBlocksFor(fc.meta.type).forEach((b) => {
    extendedZones.forEach((z) => {
      const c = fc.extendedSnowLevel?.[z.id]?.[b.key]
      if (c && blank(c.freezing)) push('Extended snow level', `${z.name} ${b.label}`, 'level')
    })
  })

  // The synopsis is required; the extended synopsis is optional (PR #158).
  if (blankRichText(fc.discussion?.synopsis)) push('Discussion', 'Synopsis', 'text')
  return missing
}

// Group the missing list into a short human summary for the publish toast.
export function summarizeMissing(missing: MissingField[], examplesPer = 3): string[] {
  const bySection: Record<string, MissingField[]> = {}
  missing.forEach((m) => {
    ;(bySection[m.section] ||= []).push(m)
  })
  return Object.entries(bySection).map(([section, list]) => {
    const examples = list
      .slice(0, examplesPer)
      .map((m) => (m.field ? `${m.where} ${m.field}` : m.where))
      .join(', ')
    const more = list.length > examplesPer ? ', …' : ''
    return `${section}: ${list.length} missing (${examples}${more})`
  })
}

// The SLR a whole period shares, for the density quick-set's state: the
// common value when every point agrees, 'mixed' when they don't (including a
// partly filled column), null when nothing is set yet.
export function sharedDensity(
  precip: CellTable<Pick<PrecipCell, 'density'>> | undefined,
  points: ForecastPoint[] | undefined,
  periodKey: string,
): number | 'mixed' | null {
  const values = (points || []).map((p) => precip?.[p.code]?.[periodKey]?.density)
  const filled = values.filter((v) => v != null && v !== '')
  if (!filled.length) return null
  if (filled.length !== values.length) return 'mixed'
  const first = Number(filled[0])
  return filled.every((v) => Number(v) === first) ? first : 'mixed'
}

export function pointsForZone(
  points: ForecastPoint[] | undefined,
  zoneId: string,
): ForecastPoint[] {
  return (points || []).filter((p) => p.zone === zoneId)
}

// dashboard-v2 config points store `zone` as the zone NAME ("Olympics") while
// the forecast body keys by zone id ("olympics"). Map names → ids using the
// configured zones. Kept for parity; AvyWeb Settings points carry a zoneCode
// directly (see pointsFromSettings).
export function normalizeConfigPoints(
  points: Array<Partial<ForecastPoint>> | undefined,
  zones: Zone[] | undefined,
): ForecastPoint[] {
  const nameToId = Object.fromEntries((zones || []).map((z) => [z.name, z.id]))
  return (points || [])
    .filter((p): p is Partial<ForecastPoint> & { code: string } => Boolean(p && p.code))
    .map((p) => ({
      code: p.code,
      name: p.name ?? '',
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      zone: nameToId[p.zone ?? ''] || p.zone || '',
    }))
}

// --- Settings adapters ------------------------------------------------------
// The tenant's Settings mwf group is the AvyWeb source for zones/points. These
// map its rows into the shapes this module keys forecasts by.
interface SettingsZoneRow {
  code: string
  name: string
  airfireZoneId?: string | null
}
interface SettingsPointRow {
  code: string
  name: string
  zoneCode: string
  latitude: number
  longitude: number
}

export function zonesFromSettings(rows: SettingsZoneRow[] | undefined | null): Zone[] {
  return (rows || []).filter((z) => z.code && z.name).map((z) => ({ id: z.code, name: z.name }))
}

export function pointsFromSettings(rows: SettingsPointRow[] | undefined | null): ForecastPoint[] {
  return (rows || [])
    .filter((p) => p.code)
    .map((p) => ({
      code: p.code,
      name: p.name,
      zone: p.zoneCode,
      lat: p.latitude ?? null,
      lng: p.longitude ?? null,
    }))
}

// Airfire "summary by zone" artifact codes → forecast zone ids, from the
// zones' configured airfireZoneId (dashboard-v2 hardcoded this map; here it is
// tenant config, per the PRD).
export function airfireCodeMap(rows: SettingsZoneRow[] | undefined | null): Record<string, string> {
  const out: Record<string, string> = {}
  ;(rows || []).forEach((z) => {
    if (z.airfireZoneId && z.code) out[z.airfireZoneId] = z.code
  })
  return out
}

// --- Empty forecast model (config-driven) ---------------------------------
// Every cell starts blank; the forecaster fills them in, or the model is
// hydrated from the last published/draft forecast. `guidance` is filled live
// (applyGuidance) keyed by the configured model title.
export function emptyPrecip(points: ForecastPoint[] | undefined): CellTable<PrecipCell> {
  const out: CellTable<PrecipCell> = {}
  ;(points || []).forEach((pt) => {
    out[pt.code] = {}
    PERIODS.forEach((per) => {
      out[pt.code][per.key] = { qpf: null, density: null, guidance: {} }
    })
  })
  return out
}

export function emptySnowLevel(zones: Zone[] | undefined): CellTable<SnowLevelCell> {
  const out: CellTable<SnowLevelCell> = {}
  ;(zones || []).forEach((z) => {
    out[z.id] = {}
    BLOCKS.forEach((b) => {
      out[z.id][b.key] = { freezing: null, drop: DEFAULT_DROP_FT, mode: 'auto' }
    })
  })
  return out
}

// Same cell shape as the main snow/freezing table; zones here are the subset
// configured as extended snow-level zones.
export function emptyExtendedSnowLevel(zones: Zone[] | undefined): CellTable<SnowLevelCell> {
  const out: CellTable<SnowLevelCell> = {}
  ;(zones || []).forEach((z) => {
    out[z.id] = {}
    EXTENDED_BLOCKS.forEach((b) => {
      out[z.id][b.key] = { freezing: null, drop: DEFAULT_DROP_FT, mode: 'auto' }
    })
  })
  return out
}

export function emptyTemps(zones: Zone[] | undefined): CellTable<TempsCell> {
  const out: CellTable<TempsCell> = {}
  ;(zones || []).forEach((z) => {
    out[z.id] = {}
    PERIODS.forEach((per) => {
      out[z.id][per.key] = { high: null, low: null, guidance: {} }
    })
  })
  return out
}

export function emptyWind(zones: Zone[] | undefined): CellTable<WindCell> {
  const out: CellTable<WindCell> = {}
  ;(zones || []).forEach((z) => {
    out[z.id] = {}
    BLOCKS.forEach((b) => {
      out[z.id][b.key] = { dir: '', speed: null, guidance: {} }
    })
  })
  return out
}

export function emptySensible(zones: Zone[] | undefined): Record<string, SensibleSlots> {
  const out: Record<string, SensibleSlots> = {}
  ;(zones || []).forEach((z) => {
    out[z.id] = { morning: '', afternoon: '' }
  })
  return out
}

// Today in the CENTER's timezone, as [y, m, d]. The service day is the
// center's day — an author east of the center is already on tomorrow while
// the center is still on today, and would anchor Day 1 a day ahead. Falls
// back to runtime-local when no usable timezone is given (PR #158 final).
function todayParts(now: Date, tz?: string): [number, number, number] {
  if (tz) {
    try {
      const stamp = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now)
      const [y, m, d] = stamp.split('-').map(Number)
      return [y, m, d]
    } catch {
      // unknown tz — fall through to runtime-local
    }
  }
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
}

// Center-local ISO timestamp (no offset) `dayOffset` days out at `hour`.
function isoAt(dayOffset: number, hour: number, now: Date, tz?: string): string {
  const [y, m, day] = todayParts(now, tz)
  const d = new Date(y, m - 1, day + dayOffset)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00`
}
// Today as "YYYY-MM-DD" in the center's timezone.
export function todayDate(now: Date = new Date(), tz?: string): string {
  return isoAt(0, 0, now, tz).slice(0, 10)
}

// The hours the AM and PM shifts aim to publish at.
export const MORNING_ISSUE_HOUR = 7
export const AFTERNOON_ISSUE_HOUR = 15
// Date fields stamped at creation, in the center's timezone.
export function creationMeta(
  type: IssuanceType = 'morning',
  tz?: string,
  now: Date = new Date(),
): { issued: string; initialDate: string } {
  return {
    issued: isoAt(0, type === 'afternoon' ? AFTERNOON_ISSUE_HOUR : MORNING_ISSUE_HOUR, now, tz),
    initialDate: todayDate(now, tz),
  }
}

// A blank forecast for the center's zones/points. Morning issuance defaults to
// a 7am issued time (PR #158; was 6am), afternoon to 3pm. `initialDate`
// anchors every period's date label and is set once at creation.
export function emptyForecast(
  zones: Zone[] | undefined,
  points: ForecastPoint[] | undefined,
  type: IssuanceType = 'morning',
  now: Date = new Date(),
  tz?: string,
): MwfForecast {
  return {
    meta: { type, author: '', ...creationMeta(type, tz, now) },
    preserved: emptyPreserved(),
    precip: emptyPrecip(points),
    snowLevel: emptySnowLevel(zones),
    extendedSnowLevel: {},
    temps: emptyTemps(zones),
    wind: emptyWind(zones),
    sensible: emptySensible(zones),
    discussion: { synopsis: '', extended: '' },
  }
}

// --- Copy-forward / Prev-column alignment ---------------------------------
// Cells are keyed by period/block keys RELATIVE to each forecast's own
// initialDate (d1 = that forecast's first day). A previous issuance therefore
// can't be read against a newer forecast verbatim: PM→next-morning shifts a
// calendar day (prev d2 is the new d1), and the afternoon body has no
// d1/am1/pm1 at all. Re-key a forecast-shaped object to a new Day-1 anchor so
// every value stays on the same absolute half-day; slots the source horizon
// can't cover become blank. Sensible weather + discussion are prose with no
// period keys — they pass through unchanged.
const EMPTY_CELL = {
  precip: (): PrecipCell => ({ qpf: null, density: null, guidance: {} }),
  temps: (): TempsCell => ({ high: null, low: null, guidance: {} }),
  snowLevel: (): SnowLevelCell => ({ freezing: null, drop: DEFAULT_DROP_FT, mode: 'auto' }),
  wind: (): WindCell => ({ dir: '', speed: null, guidance: {} }),
}

// Copy-forward only makes sense across adjacent issuances: the previous
// forecast anchored on the same day (AM → PM) or the day before (PM → next
// AM). Anything older pre-populates nothing — numeric cells would blank via
// re-anchoring anyway, and prose (discussion, sensible weather) must not
// carry stale text across a gap.
export function withinCopyForwardHorizon(
  previousServiceDate: string,
  newServiceDate: string,
): boolean {
  const from = parseLocalDate(previousServiceDate)
  const to = parseLocalDate(newServiceDate)
  const deltaDays = Math.round((to.getTime() - from.getTime()) / 86400000)
  return deltaDays >= 0 && deltaDays <= 1
}

export function shiftBodyToAnchor(fc: MwfForecast, anchor: string): MwfForecast {
  const out = structuredClone(fc)
  const from = parseLocalDate(out.meta?.initialDate)
  const to = parseLocalDate(anchor)
  const delta = Math.round((to.getTime() - from.getTime()) / 86400000)
  if (out.meta) out.meta.initialDate = anchor
  if (!delta || Number.isNaN(delta)) return out
  // Source key for each target key: same kind/slot, `delta` days later in the
  // source's own frame (its d1 is `delta` days behind the new anchor).
  const periodSrc: Record<string, string | undefined> = {}
  PERIODS.forEach((p) => {
    periodSrc[p.key] = PERIODS.find(
      (q) => q.kind === p.kind && q.dayOffset === p.dayOffset + delta,
    )?.key
  })
  const shiftKey = (key: string, all: Array<{ key: string }>): string | undefined => {
    const m = key.match(/^([a-z]+)(\d)$/)
    if (!m) return undefined
    const src = `${m[1]}${Number(m[2]) + delta}`
    return all.some((x) => x.key === src) ? src : undefined
  }
  const blockSrc: Record<string, string | undefined> = {}
  BLOCKS.forEach((b) => {
    blockSrc[b.key] = shiftKey(b.key, BLOCKS)
  })
  // Extended keys shift the same way (nt3 ← prev nt4); slots past the prior
  // horizon (am4, day5, ...) go blank — yesterday never forecast them.
  const extendedSrc: Record<string, string | undefined> = {}
  EXTENDED_BLOCKS.forEach((b) => {
    extendedSrc[b.key] = shiftKey(b.key, EXTENDED_BLOCKS)
  })
  const remap = <C>(
    section: CellTable<C> | undefined,
    srcMap: Record<string, string | undefined>,
    blankCell: () => C,
  ) => {
    Object.values(section || {}).forEach((cells) => {
      const before = { ...cells }
      Object.keys(cells).forEach((key) => {
        const src = srcMap[key]
        cells[key] = src && before[src] ? before[src] : blankCell()
      })
    })
  }
  remap(out.precip, periodSrc, EMPTY_CELL.precip)
  remap(out.temps, periodSrc, EMPTY_CELL.temps)
  remap(out.snowLevel, blockSrc, EMPTY_CELL.snowLevel)
  remap(out.extendedSnowLevel, extendedSrc, EMPTY_CELL.snowLevel)
  remap(out.wind, blockSrc, EMPTY_CELL.wind)
  return out
}

// Zone-level QPF proxy for a 6h block: mean QPF of the zone's points in the
// 12h period that block belongs to. Drives the snow-vs-freezing designation.
export function zoneBlockQpf(
  precip: CellTable<Pick<PrecipCell, 'qpf'>>,
  points: ForecastPoint[] | undefined,
  zoneId: string,
  blockKey: string,
): number {
  const block = BLOCKS.find((b) => b.key === blockKey)
  if (!block) return 0
  const pts = pointsForZone(points, zoneId)
  if (!pts.length) return 0
  const sum = pts.reduce((acc, p) => acc + (Number(precip[p.code]?.[block.period]?.qpf) || 0), 0)
  return sum / pts.length
}

// --- Map preview + guidance mapping ---------------------------------------
// First block of each 12h period — surfaces the 6h-block fields (freezing,
// snow level, wind) on the period-based map preview.
export const PERIOD_BLOCK: Record<string, string> = {
  d1: 'am1',
  n1: 'ev1',
  d2: 'am2',
  n2: 'ev2',
  d3: 'am3',
}

export const WIND_DEG: Record<string, number> = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
  VAR: 0,
}

export interface PrecipGuidanceArtifact {
  periods: Array<{ points?: Record<string, Record<string, number | null>> }>
}
export interface TempsGuidanceArtifact {
  periods: Array<{
    zones?: Record<string, Record<string, { high: number | null; low: number | null } | null>>
  }>
}
export interface WindsGuidanceArtifact {
  blocks: Array<{
    zones?: Record<string, Record<string, { speed: number | null; dir: string | null } | null>>
  }>
}

// Map a guidance artifact onto the form. The artifact's periods are in
// forecast-hour order; they fill the SHOWN periods (periodsFor) BY POSITION —
// so a morning issuance fills from Day 1 and afternoon from Night 1 (the
// model's data only spans the forecast window). Guidance is keyed by the
// configured model TITLE; only the reference columns are touched — entered
// values are untouched.
export function applyGuidance(
  forecast: MwfForecast,
  artifact: PrecipGuidanceArtifact | null | undefined,
): number {
  if (!artifact || !Array.isArray(artifact.periods)) return 0
  const shown = periodsFor(forecast.meta.type)
  let applied = 0
  artifact.periods.forEach((period, i) => {
    const periodKey = shown[i]?.key
    if (!periodKey) return
    for (const [code, models] of Object.entries(period.points || {})) {
      const cell = forecast.precip?.[code]?.[periodKey]
      if (!cell) continue
      for (const [title, value] of Object.entries(models)) {
        if (value != null) {
          cell.guidance[title] = value
          applied += 1
        }
      }
    }
  })
  return applied
}

// Temps artifact periods fill the shown periods BY POSITION (see applyGuidance);
// artifact zone codes → zone ids via the configured map (airfireCodeMap);
// guidance keyed by model TITLE → { high, low }.
export function applyTempsGuidance(
  forecast: MwfForecast,
  artifact: TempsGuidanceArtifact | null | undefined,
  codeToZoneId: Record<string, string>,
): number {
  if (!artifact || !Array.isArray(artifact.periods)) return 0
  const shown = periodsFor(forecast.meta.type)
  let applied = 0
  artifact.periods.forEach((period, i) => {
    const periodKey = shown[i]?.key
    if (!periodKey) return
    for (const [code, models] of Object.entries(period.zones || {})) {
      const cell = forecast.temps?.[codeToZoneId[code]]?.[periodKey]
      if (!cell) continue
      for (const [title, v] of Object.entries(models)) {
        if (v && v.high != null && v.low != null) {
          cell.guidance[title] = { high: v.high, low: v.low }
          applied += 1
        }
      }
    }
  })
  return applied
}

// Winds artifact blocks fill the shown 6h blocks BY POSITION (see applyGuidance);
// artifact zone codes → zone ids via the configured map; guidance keyed by
// model TITLE → { speed, dir }.
export function applyWindsGuidance(
  forecast: MwfForecast,
  artifact: WindsGuidanceArtifact | null | undefined,
  codeToZoneId: Record<string, string>,
): number {
  if (!artifact || !Array.isArray(artifact.blocks)) return 0
  const shown = blocksFor(forecast.meta.type)
  let applied = 0
  artifact.blocks.forEach((block, i) => {
    const blockKey = shown[i]?.key
    if (!blockKey) return
    for (const [code, models] of Object.entries(block.zones || {})) {
      const cell = forecast.wind?.[codeToZoneId[code]]?.[blockKey]
      if (!cell) continue
      for (const [title, v] of Object.entries(models)) {
        if (v && v.speed != null && v.dir != null) {
          cell.guidance[title] = { speed: v.speed, dir: v.dir }
          applied += 1
        }
      }
    }
  })
  return applied
}

// --- Persistence (de)serialization ----------------------------------------
// The stored `body` holds only the forecaster's ENTERED values — guidance is
// re-overlaid live on load. serialize strips guidance; hydrate writes the body
// back onto the seeded forecast (non-destructive: only cells that already
// exist for the current config/zones are touched).
function mapCells<C, O>(table: CellTable<C> | undefined, pick: (cell: C) => O): CellTable<O> {
  const out: CellTable<O> = {}
  for (const [key, inner] of Object.entries(table || {})) {
    out[key] = {}
    for (const [k, cell] of Object.entries(inner)) out[key][k] = pick(cell)
  }
  return out
}

// A real cell always wins; only genuinely homeless preserved values restore.
function mergePreserved<C>(out: CellTable<C>, kept: CellTable<C> | undefined): CellTable<C> {
  for (const [key, inner] of Object.entries(kept || {})) {
    for (const [k, v] of Object.entries(inner || {})) {
      out[key] ||= {}
      if (out[key][k] === undefined) out[key][k] = v
    }
  }
  return out
}

export function serializeForecast(forecast: MwfForecast): SerializedForecast {
  const kept = forecast.preserved ?? emptyPreserved()
  const sensible: Record<string, SensibleSlots> = structuredClone(forecast.sensible || {})
  for (const [z, slots] of Object.entries(kept.sensible || {})) {
    if (sensible[z] === undefined) sensible[z] = slots
  }
  return {
    meta: { ...forecast.meta },
    precip: mergePreserved(
      mapCells(forecast.precip, (c) => ({ qpf: c.qpf, density: c.density })),
      kept.precip,
    ),
    temps: mergePreserved(
      mapCells(forecast.temps, (c) => ({ high: c.high, low: c.low })),
      kept.temps,
    ),
    wind: mergePreserved(
      mapCells(forecast.wind, (c) => ({ dir: c.dir, speed: c.speed })),
      kept.wind,
    ),
    snowLevel: mergePreserved(
      mapCells(forecast.snowLevel, (c) => ({
        freezing: c.freezing,
        drop: c.drop,
        mode: c.mode,
      })),
      kept.snowLevel,
    ),
    extendedSnowLevel: mergePreserved(
      mapCells(forecast.extendedSnowLevel, (c) => ({
        freezing: c.freezing,
        drop: c.drop,
        mode: c.mode,
      })),
      kept.extendedSnowLevel,
    ),
    sensible,
    discussion: { ...forecast.discussion },
  }
}

// Cells the current config dropped (a retired point) are stashed rather than
// discarded, so correcting an older forecast doesn't publish them away.
function hydrateCells<C, V>(
  table: CellTable<C> | undefined,
  body: CellTable<V> | undefined,
  assign: (cell: C, v: V) => void,
  stash?: CellTable<V>,
) {
  for (const [key, inner] of Object.entries(body || {})) {
    for (const [k, v] of Object.entries(inner || {})) {
      const cell = table?.[key]?.[k]
      if (cell) {
        assign(cell, v)
      } else if (stash) {
        stash[key] ||= {}
        stash[key][k] = v
      }
    }
  }
}

export function hydrateForecast(
  forecast: MwfForecast,
  body: Partial<SerializedForecast> | null | undefined,
): void {
  if (!body) return
  if (body.meta) Object.assign(forecast.meta, body.meta)
  // Forecasts saved before initialDate existed: anchor to the issued date.
  if (!forecast.meta.initialDate) {
    forecast.meta.initialDate = (forecast.meta.issued || '').slice(0, 10) || todayDate()
  }
  const kept = emptyPreserved()
  hydrateCells(
    forecast.precip,
    body.precip,
    (c, v) => Object.assign(c, { qpf: v.qpf, density: v.density }),
    kept.precip,
  )
  hydrateCells(
    forecast.temps,
    body.temps,
    (c, v) => Object.assign(c, { high: v.high, low: v.low }),
    kept.temps,
  )
  hydrateCells(
    forecast.wind,
    body.wind,
    (c, v) => Object.assign(c, { dir: v.dir, speed: v.speed }),
    kept.wind,
  )
  hydrateCells(
    forecast.snowLevel,
    body.snowLevel,
    (c, v) => Object.assign(c, { freezing: v.freezing, drop: v.drop, mode: v.mode }),
    kept.snowLevel,
  )
  hydrateCells(
    forecast.extendedSnowLevel,
    body.extendedSnowLevel,
    (c, v) => Object.assign(c, { freezing: v.freezing, drop: v.drop, mode: v.mode }),
    kept.extendedSnowLevel,
  )
  for (const [z, slots] of Object.entries(body.sensible || {})) {
    if (forecast.sensible?.[z]) Object.assign(forecast.sensible[z], slots)
    else kept.sensible[z] = slots
  }
  forecast.preserved = kept
  if (body.discussion) Object.assign(forecast.discussion, body.discussion)
}
