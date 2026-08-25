// MWF model-guidance builders — TypeScript port of products-api's
// mwf_qpf.py / mwf_zone.py, scoped to the JSON source types (grib2 is out of
// scope for the local proof; the PRD's contingency is a small Python artifact
// job porting the proven fetcher).
//
// Two source shapes, both driven entirely by the tenant's Settings mwf config:
//  - point JSON ("point-json"): one run-stamped JSON of per-station records;
//    config.periodFields maps each 12h period id to the record field holding
//    that period's QPF (e.g. legacy WRF FH24/36/48/60).
//  - zone-summary JSON ("zone-summary-json"): Airfire "summary by zone" files,
//    one per slot (temps: high/low; winds: speed/dir), keyed by a zone code;
//    config.periodFields / config.blockFields map periods/blocks to fields.
//
// Artifacts mirror the products-api wire shape so the editor overlay logic
// (applyGuidance / applyTempsGuidance / applyWindsGuidance) consumes them
// unchanged: models are keyed by TITLE, every model reports a status, and an
// all-null build reports "no records matched" rather than "loaded" so blank
// data can never masquerade as healthy (and never replaces last-good cache).

export const RUN_CYCLE_HOURS: readonly number[] = [0, 12]

// Four 12h windows anchored at Night 1 — the artifact fills the editor's
// SHOWN periods by position (morning from Day 1, afternoon from Night 1).
export const DEFAULT_PERIODS = [
  { id: 'night1', label: 'Night 1' },
  { id: 'day2', label: 'Day 2' },
  { id: 'night2', label: 'Night 2' },
  { id: 'day3', label: 'Day 3' },
] as const

export const WIND_BLOCKS = [
  { id: 'ev1', label: 'Eve 1' },
  { id: 'nt1', label: 'Night 1' },
  { id: 'am2', label: 'AM 2' },
  { id: 'pm2', label: 'PM 2' },
  { id: 'ev2', label: 'Eve 2' },
  { id: 'nt2', label: 'Night 2' },
  { id: 'am3', label: 'AM 3' },
  { id: 'pm3', label: 'PM 3' },
] as const

export interface GuidanceModelConfig {
  stationKey?: string
  zoneKey?: string
  runCycleHours?: number[]
  periodFields?: Record<string, string>
  blockFields?: Record<string, string>
  urls?: Record<string, string>
  table?: 'precip' | 'temps' | 'winds'
}

export interface GuidanceModelRow {
  name: string
  sourceType: 'point-json' | 'zone-summary-json'
  url: string
  config?: unknown
}

export interface GuidancePointRow {
  code: string
  name: string
}

export interface ModelMeta {
  title: string
  sourceType: string
  run?: string
  status: string
}

export interface QpfArtifact {
  available: boolean
  generatedAt: string
  cycle: string | null
  cycleHours: number[]
  periods: Array<{
    id: string
    label: string
    points: Record<string, Record<string, number | null>>
  }>
  models: ModelMeta[]
  points: GuidancePointRow[]
  refreshError?: string
}

export interface ZoneArtifact {
  available: boolean
  generatedAt: string
  cycle: string | null
  cycleHours: number[]
  blocks: Array<{
    id: string
    label: string
    zones: Record<string, Record<string, Record<string, number | string | null>>>
  }>
  models: ModelMeta[]
  zones: string[]
  refreshError?: string
}

export type GuidanceArtifact = QpfArtifact | ZoneArtifact

export function parseModelConfig(raw: unknown): GuidanceModelConfig {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch {
      return {}
    }
  }
  return {}
}

// Most-recent model cycles at `cycleHours` (evenly spaced across the day),
// newest first.
export function candidateCycles(now: Date, cycleHours: readonly number[], depth = 3): Date[] {
  const valid = [...cycleHours].sort((a, b) => a - b)
  const step = 24 / valid.length
  const base = new Date(now)
  base.setUTCMinutes(0, 0, 0)
  const hoursBefore = valid.filter((h) => h <= base.getUTCHours())
  const anchor = new Date(base)
  if (hoursBefore.length) {
    anchor.setUTCHours(hoursBefore[hoursBefore.length - 1])
  } else {
    anchor.setUTCDate(anchor.getUTCDate() - 1)
    anchor.setUTCHours(valid[valid.length - 1])
  }
  return Array.from({ length: depth }, (_, i) => new Date(anchor.getTime() - step * i * 3600_000))
}

export function runStamp(cycle: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${cycle.getUTCFullYear()}${pad(cycle.getUTCMonth() + 1)}${pad(cycle.getUTCDate())}${pad(cycle.getUTCHours())}`
}

// Resolve a source URL template's tokens: {run} (YYYYMMDDHH) and {point}.
export function fillUrl(
  template: string,
  { run, point }: { run?: string; point?: string },
): string {
  let out = template
  if (run != null) out = out.replaceAll('{run}', run)
  if (point != null) out = out.replaceAll('{point}', point)
  return out
}

// Light SSRF guard for tenant-configured source URLs.
export function validateOutboundUrl(raw: string): void {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`invalid source URL: ${raw}`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`unsupported protocol: ${url.protocol}`)
  }
  const host = url.hostname
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === '169.254.169.254'
  ) {
    throw new Error(`blocked source host: ${host}`)
  }
}

export type FetchJson = (url: string) => Promise<unknown>

export async function defaultFetchJson(url: string): Promise<unknown> {
  validateOutboundUrl(url)
  const res = await fetch(url, { signal: AbortSignal.timeout(40_000), cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

// Newest run whose file actually exists, probing newest-first; falls back to
// the oldest candidate so a build attempt still names a concrete run.
export async function selectRun(
  fetchJson: FetchJson,
  urlTemplate: string,
  runHours: readonly number[],
  now: Date,
): Promise<{ run: string; payload: unknown | null }> {
  const candidates = candidateCycles(now, runHours)
  for (const cycle of candidates) {
    const run = runStamp(cycle)
    try {
      const payload = await fetchJson(fillUrl(urlTemplate, { run }))
      return { run, payload }
    } catch {
      // try the previous cycle
    }
  }
  return { run: runStamp(candidates[candidates.length - 1]), payload: null }
}

const isRecordArray = (payload: unknown): payload is Record<string, unknown>[] =>
  Array.isArray(payload)

function recordsOf(payload: unknown): Record<string, unknown>[] {
  if (isRecordArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    return Object.values(payload).filter(
      (r): r is Record<string, unknown> => r != null && typeof r === 'object',
    )
  }
  return []
}

const roundOrNull = (value: unknown): number | null => {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

const isoZ = (d: Date) => d.toISOString().replace('.000Z', 'Z')

// --- point JSON (QPF) -------------------------------------------------------

async function buildPointJsonModel(
  fetchJson: FetchJson,
  model: GuidanceModelRow,
  points: GuidancePointRow[],
  now: Date,
): Promise<{ run: string; totals: Record<string, Record<string, number>>; loaded: boolean }> {
  const cfg = parseModelConfig(model.config)
  const stationKey = cfg.stationKey ?? 'station'
  const periodFields = cfg.periodFields ?? {}
  if (!Object.keys(periodFields).length) {
    throw new Error("model config is missing 'periodFields' (period id → source field)")
  }
  const runHours = cfg.runCycleHours ?? [...RUN_CYCLE_HOURS]
  const codes = new Set(points.map((p) => p.code))

  // A {point} template needs one fetch per point; a run-level file needs one.
  const perPoint = model.url.includes('{point}')
  const totals: Record<string, Record<string, number>> = {}
  DEFAULT_PERIODS.forEach((p) => {
    totals[p.id] = {}
  })

  const ingest = (records: Record<string, unknown>[], onlyCode?: string) => {
    for (const record of records) {
      const code = onlyCode ?? String(record[stationKey] ?? '')
      if (!codes.has(code)) continue
      for (const period of DEFAULT_PERIODS) {
        const field = periodFields[period.id]
        const value = field ? record[field] : null
        if (field && value != null && Number.isFinite(Number(value))) {
          totals[period.id][code] = Number(value)
        }
      }
    }
  }

  if (perPoint) {
    let run = ''
    for (const point of points) {
      const template = fillUrl(model.url, { point: point.code })
      const selected = await selectRun(fetchJson, template, runHours, now)
      run = run || selected.run
      if (selected.payload != null) ingest(recordsOf(selected.payload), point.code)
    }
    const loaded = Object.values(totals).some((byCode) => Object.keys(byCode).length > 0)
    return { run, totals, loaded }
  }

  const { run, payload } = await selectRun(fetchJson, model.url, runHours, now)
  if (payload != null) ingest(recordsOf(payload))
  const loaded = Object.values(totals).some((byCode) => Object.keys(byCode).length > 0)
  return { run, totals, loaded }
}

export async function buildQpfGuidance(
  models: GuidanceModelRow[],
  points: GuidancePointRow[],
  { now = new Date(), fetchJson = defaultFetchJson }: { now?: Date; fetchJson?: FetchJson } = {},
): Promise<QpfArtifact> {
  const results: Record<string, Record<string, Record<string, number>>> = {}
  const meta: ModelMeta[] = []
  let cycle: string | null = null

  for (const model of models) {
    try {
      const { run, totals, loaded } = await buildPointJsonModel(fetchJson, model, points, now)
      results[model.name] = totals
      if (!cycle && run) {
        cycle = isoZ(
          new Date(
            Date.UTC(
              Number(run.slice(0, 4)),
              Number(run.slice(4, 6)) - 1,
              Number(run.slice(6, 8)),
              Number(run.slice(8, 10)),
            ),
          ),
        )
      }
      meta.push({
        title: model.name,
        sourceType: model.sourceType,
        run,
        status: loaded ? 'loaded' : 'no records matched',
      })
    } catch (error) {
      results[model.name] = {}
      meta.push({
        title: model.name,
        sourceType: model.sourceType,
        status: `error: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  return {
    available: models.length > 0 && points.length > 0,
    generatedAt: isoZ(now),
    cycle,
    cycleHours: [...RUN_CYCLE_HOURS],
    periods: DEFAULT_PERIODS.map((period) => ({
      id: period.id,
      label: period.label,
      points: Object.fromEntries(
        points.map((point) => [
          point.code,
          Object.fromEntries(
            models.map((model) => [
              model.name,
              roundOrNull(results[model.name]?.[period.id]?.[point.code]),
            ]),
          ),
        ]),
      ),
    })),
    models: meta,
    points: points.map((p) => ({ code: p.code, name: p.name })),
  }
}

// --- zone-summary JSON (temps / winds) --------------------------------------

const TABLE_SLOTS: Record<'temps' | 'winds', Array<[string, 'number' | 'string']>> = {
  temps: [
    ['high', 'number'],
    ['low', 'number'],
  ],
  winds: [
    ['speed', 'number'],
    ['dir', 'string'],
  ],
}

const coerce = (value: unknown, kind: 'number' | 'string'): number | string | null => {
  if (value == null) return null
  if (kind === 'number') {
    const n = Number(value)
    return Number.isFinite(n) ? Math.round(n) : null
  }
  return String(value)
}

export async function buildZoneGuidance(
  models: GuidanceModelRow[],
  table: 'temps' | 'winds',
  { now = new Date(), fetchJson = defaultFetchJson }: { now?: Date; fetchJson?: FetchJson } = {},
): Promise<ZoneArtifact> {
  const slots = TABLE_SLOTS[table]
  const blocks =
    table === 'temps'
      ? DEFAULT_PERIODS.map((p) => ({ id: p.id, label: p.label }))
      : WIND_BLOCKS.map((b) => ({ id: b.id, label: b.label }))
  const fieldsKey = table === 'temps' ? 'periodFields' : 'blockFields'

  const results: Record<
    string,
    Record<string, Record<string, Record<string, number | string | null>>>
  > = {}
  const meta: ModelMeta[] = []
  let cycle: string | null = null

  for (const model of models) {
    try {
      const cfg = parseModelConfig(model.config)
      const urls = cfg.urls ?? {}
      const zoneKey = cfg.zoneKey ?? 'zone'
      const fieldMap = (table === 'temps' ? cfg.periodFields : cfg.blockFields) ?? {}
      const missing = blocks.filter((b) => !fieldMap[b.id]).map((b) => b.id)
      if (missing.length) {
        throw new Error(
          `model config is missing '${fieldsKey}' for block(s): ${missing.join(', ')}`,
        )
      }
      const firstUrl = slots.map(([slot]) => urls[slot]).find(Boolean)
      if (!firstUrl) throw new Error('no urls configured')
      const runHours = cfg.runCycleHours ?? [...RUN_CYCLE_HOURS]
      const { run } = await selectRun(fetchJson, firstUrl, runHours, now)

      const slotMaps: Record<string, Record<string, Record<string, unknown>>> = {}
      for (const [slot] of slots) {
        const template = urls[slot]
        if (!template) throw new Error(`missing '${slot}' URL`)
        const payload = await fetchJson(fillUrl(template, { run }))
        const map: Record<string, Record<string, unknown>> = {}
        recordsOf(payload).forEach((record) => {
          const zone = String(record[zoneKey] ?? '')
          if (zone) map[zone] = record
        })
        slotMaps[slot] = map
      }

      const zones = new Set<string>()
      Object.values(slotMaps).forEach((m) => Object.keys(m).forEach((z) => zones.add(z)))

      const modelTable: Record<string, Record<string, Record<string, number | string | null>>> = {}
      let hasValues = false
      for (const block of blocks) {
        const field = fieldMap[block.id]
        const cell: Record<string, Record<string, number | string | null>> = {}
        zones.forEach((zone) => {
          const vals: Record<string, number | string | null> = {}
          for (const [slot, kind] of slots) {
            const record = slotMaps[slot]?.[zone]
            vals[slot] = coerce(record ? record[field] : null, kind)
            if (vals[slot] != null) hasValues = true
          }
          cell[zone] = vals
        })
        modelTable[block.id] = cell
      }

      results[model.name] = modelTable
      if (!cycle && run) {
        cycle = isoZ(
          new Date(
            Date.UTC(
              Number(run.slice(0, 4)),
              Number(run.slice(4, 6)) - 1,
              Number(run.slice(6, 8)),
              Number(run.slice(8, 10)),
            ),
          ),
        )
      }
      meta.push({
        title: model.name,
        sourceType: model.sourceType,
        run,
        status: hasValues ? 'loaded' : 'no records matched',
      })
    } catch (error) {
      results[model.name] = {}
      meta.push({
        title: model.name,
        sourceType: model.sourceType,
        status: `error: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  const allZones = new Set<string>()
  Object.values(results).forEach((modelTable) =>
    Object.values(modelTable).forEach((cell) => Object.keys(cell).forEach((z) => allZones.add(z))),
  )
  const zoneList = Array.from(allZones).sort()

  return {
    available: models.length > 0 && zoneList.length > 0,
    generatedAt: isoZ(now),
    cycle,
    cycleHours: [...RUN_CYCLE_HOURS],
    blocks: blocks.map((block) => ({
      id: block.id,
      label: block.label,
      zones: Object.fromEntries(
        zoneList.map((zone) => [
          zone,
          Object.fromEntries(
            models
              .map((model): [string, Record<string, number | string | null>] => [
                model.name,
                results[model.name]?.[block.id]?.[zone] ?? {},
              ])
              .filter(([, vals]) => Object.values(vals).some((v) => v != null)),
          ),
        ]),
      ),
    })),
    models: meta,
    zones: zoneList,
  }
}

const hasLoadedModel = (artifact: GuidanceArtifact | null | undefined): boolean =>
  Boolean(artifact?.models.some((m) => m.status === 'loaded'))

// Keep-last-good: a build in which NO model loaded — a total source outage —
// must not replace working guidance with blank data. The previous artifact is
// kept, stamped refreshError so the UI surfaces staleness.
export function reconcileWithLastGood<A extends GuidanceArtifact>(
  fresh: A,
  previous: A | null | undefined,
): A {
  if (hasLoadedModel(fresh) || !previous || !hasLoadedModel(previous)) return fresh
  const firstFailure = fresh.models.find((m) => m.status !== 'loaded')?.status ?? 'no models loaded'
  return { ...previous, refreshError: firstFailure }
}

// Stale when a newer model cycle boundary has passed than the cached one, or
// the last refresh kept old data.
export function isStale(
  artifact: GuidanceArtifact | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!artifact) return true
  if (artifact.refreshError) return true
  if (!artifact.cycle) return true
  const cached = new Date(artifact.cycle)
  if (Number.isNaN(cached.getTime())) return true
  const expected = candidateCycles(now, artifact.cycleHours ?? RUN_CYCLE_HOURS)[0]
  return expected.getTime() > cached.getTime()
}
