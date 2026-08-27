// Cache + refresh coordination for MWF guidance artifacts, ported from
// products-api's mwf_cache.py. Keyed per (tenant, table). Refreshes are
// deduplicated (one in-flight build per key) and rate-limited; a build with
// no loaded models keeps the previous artifact stamped refreshError
// (keep-last-good). The artifact of record is a durable store row (the
// mwfGuidanceArtifacts collection — products-api persists to disk for the
// same reason): on serverless the hourly cron builds in one instance and the
// editor reads in another, so the in-process map here is only a hot layer.
// Callers pass a store (payloadArtifactStore); without one the cache is
// in-process only, which unit tests rely on.
import type { Setting } from '@/payload-types'
import type { Payload } from 'payload'
import type { Grib2Fetch } from './grib2'
import {
  buildQpfGuidance,
  buildZoneGuidance,
  isStale,
  parseModelConfig,
  reconcileWithLastGood,
  type FetchJson,
  type GuidanceArtifact,
  type GuidanceModelRow,
} from './guidance'

export const MIN_REFRESH_INTERVAL_MS = 10 * 60 * 1000

export type GuidanceTable = 'precip' | 'temps' | 'winds'

const cache = new Map<string, GuidanceArtifact>()
const inflight = new Map<string, Promise<GuidanceArtifact | null>>()
const lastAttempt = new Map<string, number>()

const key = (tenantId: number, table: GuidanceTable) => `${tenantId}:${table}`

export function loadCached(tenantId: number, table: GuidanceTable): GuidanceArtifact | null {
  return cache.get(key(tenantId, table)) ?? null
}

export function resetGuidanceCache(): void {
  cache.clear()
  inflight.clear()
  lastAttempt.clear()
}

// --- Durable store ----------------------------------------------------------

export interface ArtifactStore {
  read(tenantId: number, table: GuidanceTable): Promise<GuidanceArtifact | null>
  write(tenantId: number, table: GuidanceTable, artifact: GuidanceArtifact): Promise<void>
}

// A stored artifact is our own write, but the JSON column can't promise that
// — guard the load instead of trusting it.
function isGuidanceArtifact(value: unknown): value is GuidanceArtifact {
  return (
    value != null &&
    typeof value === 'object' &&
    'generatedAt' in value &&
    'models' in value &&
    Array.isArray(value.models)
  )
}

export function payloadArtifactStore(payload: Payload): ArtifactStore {
  const findRow = async (tenantId: number, table: GuidanceTable) => {
    const { docs } = await payload.find({
      collection: 'mwfGuidanceArtifacts',
      where: { and: [{ tenant: { equals: tenantId } }, { table: { equals: table } }] },
      limit: 1,
      depth: 0,
    })
    return docs[0] ?? null
  }
  return {
    async read(tenantId, table) {
      const row = await findRow(tenantId, table)
      return row && isGuidanceArtifact(row.artifact) ? row.artifact : null
    },
    async write(tenantId, table, artifact) {
      // Spread into a fresh literal: the JSON column type wants an index
      // signature the artifact interfaces don't declare.
      const value = { ...artifact }
      const row = await findRow(tenantId, table)
      if (row) {
        await payload.update({
          collection: 'mwfGuidanceArtifacts',
          id: row.id,
          data: { artifact: value },
        })
      } else {
        await payload.create({
          collection: 'mwfGuidanceArtifacts',
          data: { tenant: tenantId, table, artifact: value },
        })
      }
    },
  }
}

// Warm the in-process hot layer from the durable row. Used on cold starts —
// both to serve reads without a rebuild and to give keep-last-good something
// to keep when the first build of a fresh instance fails.
export async function loadDurable(
  store: ArtifactStore,
  tenantId: number,
  table: GuidanceTable,
): Promise<GuidanceArtifact | null> {
  const hot = loadCached(tenantId, table)
  if (hot) return hot
  const stored = await store.read(tenantId, table)
  if (stored) cache.set(key(tenantId, table), stored)
  return stored
}

type MwfConfig = NonNullable<Setting['mwf']>

// Which configured models feed a table: point-json and grib2 → precip;
// zone-summary sources say which table via config.table.
export function modelsForTable(mwfConfig: MwfConfig, table: GuidanceTable): GuidanceModelRow[] {
  const rows = mwfConfig.models ?? []
  return rows
    .filter((m) => {
      if (table === 'precip') return m.sourceType === 'point-json' || m.sourceType === 'grib2'
      return m.sourceType === 'zone-summary-json' && parseModelConfig(m.config).table === table
    })
    .map((m) => ({
      name: m.name,
      sourceType: m.sourceType,
      url: m.url,
      config: m.config,
    }))
}

async function build(
  tenantId: number,
  table: GuidanceTable,
  mwfConfig: MwfConfig,
  now: Date,
  fetchJson?: FetchJson,
  grib2Fetch?: Grib2Fetch,
  store?: ArtifactStore,
): Promise<GuidanceArtifact | null> {
  const models = modelsForTable(mwfConfig, table)
  if (!models.length) return null
  const options = {
    now,
    ...(fetchJson ? { fetchJson } : {}),
    ...(grib2Fetch ? { grib2Fetch } : {}),
  }
  const fresh =
    table === 'precip'
      ? await buildQpfGuidance(
          models,
          (mwfConfig.points ?? []).map((p) => ({
            code: p.code,
            name: p.name,
            latitude: p.latitude,
            longitude: p.longitude,
          })),
          options,
        )
      : await buildZoneGuidance(models, table, options)
  const reconciled = reconcileWithLastGood(fresh, loadCached(tenantId, table))
  cache.set(key(tenantId, table), reconciled)
  if (store) {
    // The durable row is the artifact of record; a failed write must not eat
    // the build (the hot layer still serves this instance).
    try {
      await store.write(tenantId, table, reconciled)
    } catch {
      // surfaced by the caller's own logging if it cares; keep serving
    }
  }
  return reconciled
}

// Refresh a tenant's guidance table if due. `force` bypasses the min-interval
// (the cron passes force; on-demand editor loads don't). With a store, a
// cold in-process cache is warmed from the durable row first — so an
// unexpired artifact built by another instance is served as-is, and
// keep-last-good has something to keep if this build fails.
export async function refreshGuidance(
  tenantId: number,
  table: GuidanceTable,
  mwfConfig: MwfConfig,
  {
    now = new Date(),
    force = false,
    fetchJson,
    grib2Fetch,
    store,
  }: {
    now?: Date
    force?: boolean
    fetchJson?: FetchJson
    grib2Fetch?: Grib2Fetch
    store?: ArtifactStore
  } = {},
): Promise<GuidanceArtifact | null> {
  const k = key(tenantId, table)
  const existing = inflight.get(k)
  if (existing) return existing

  const cached = store ? await loadDurable(store, tenantId, table) : loadCached(tenantId, table)
  const attempted = lastAttempt.get(k)
  if (!force) {
    if (cached && !isStale(cached, now)) return cached
    if (attempted != null && now.getTime() - attempted < MIN_REFRESH_INTERVAL_MS) return cached
  }

  lastAttempt.set(k, now.getTime())
  const run = build(tenantId, table, mwfConfig, now, fetchJson, grib2Fetch, store).finally(() => {
    inflight.delete(k)
  })
  inflight.set(k, run)
  return run
}
