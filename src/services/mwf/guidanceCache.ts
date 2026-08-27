// In-process cache + refresh coordination for MWF guidance artifacts, ported
// from products-api's mwf_cache.py. Keyed per (tenant, table). Refreshes are
// deduplicated (one in-flight build per key) and rate-limited; a build with
// no loaded models keeps the previous artifact stamped refreshError
// (keep-last-good). NOTE: per-instance, like the products-api original — a
// multi-instance deployment would promote the store to a shared backend; the
// function interface stays the same.
import type { Setting } from '@/payload-types'
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
  return reconciled
}

// Refresh a tenant's guidance table if due. `force` bypasses the min-interval
// (the cron passes force; on-demand editor loads don't).
export async function refreshGuidance(
  tenantId: number,
  table: GuidanceTable,
  mwfConfig: MwfConfig,
  {
    now = new Date(),
    force = false,
    fetchJson,
    grib2Fetch,
  }: { now?: Date; force?: boolean; fetchJson?: FetchJson; grib2Fetch?: Grib2Fetch } = {},
): Promise<GuidanceArtifact | null> {
  const k = key(tenantId, table)
  const existing = inflight.get(k)
  if (existing) return existing

  const cached = loadCached(tenantId, table)
  const attempted = lastAttempt.get(k)
  if (!force) {
    if (cached && !isStale(cached, now)) return cached
    if (attempted != null && now.getTime() - attempted < MIN_REFRESH_INTERVAL_MS) return cached
  }

  lastAttempt.set(k, now.getTime())
  const run = build(tenantId, table, mwfConfig, now, fetchJson, grib2Fetch).finally(() => {
    inflight.delete(k)
  })
  inflight.set(k, run)
  return run
}
