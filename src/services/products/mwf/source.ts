// The MWF product source — the ADR-018-shaped adapter seam for the native
// public weather page. Pages consume the MwfSource interface and its
// normalized model, never storage rows; the local Payload implementation is
// one source behind the seam (a products-api HTTP source would be another).
//
// Normalization is snapshot-faithful: a published row carries the center's
// MWF config and the product structure frozen at publish time, and the
// normalized model is built from THOSE — an archived forecast renders exactly
// as published no matter how the center's Settings have changed since.
import type { MwfForecast as MwfForecastDoc } from '@/payload-types'
import { visibleHeads } from '@/utilities/mwf/chain'
import {
  pointsFromSettings,
  zonesFromSettings,
  type ForecastPoint,
  type SerializedForecast,
  type Zone,
} from '@/utilities/mwf/mwfData'
import { MWF_STRUCTURE, type MwfStructure } from '@/utilities/mwf/structure'
import { chainRowsFor, getPublishedById, listVisibleForDate } from '@/utilities/mwf/workflow'
import type { Payload } from 'payload'

export interface MwfPublicForecast {
  id: number
  issuance: 'morning' | 'afternoon'
  serviceDate: string
  issuedAt: string | null
  createdAt: string
  revision: number
  isCorrection: boolean
  body: Partial<SerializedForecast>
  config: {
    zones: Zone[]
    points: ForecastPoint[]
    extendedZoneIds: string[]
  }
  structure: MwfStructure
}

export interface MwfArchiveEntry {
  id: number
  issuance: 'morning' | 'afternoon'
  serviceDate: string
  issuedAt: string | null
  revision: number
}

export interface MwfSource {
  // The visible issuances for a service date (default: the latest date with
  // visible content), newest first — the stacked AM+PM public view.
  stackedForDate(date?: string): Promise<MwfPublicForecast[]>
  // Lean archive index: one entry per visible chain head, newest issued
  // first, optionally bounded by issued-at range.
  archiveIndex(options?: { from?: string; to?: string; limit?: number }): Promise<MwfArchiveEntry[]>
  // One published forecast by id — superseded revisions stay fetchable,
  // scheduled-future rows stay embargoed.
  byId(id: number): Promise<MwfPublicForecast | null>
}

interface SnapshotShape {
  config?: {
    zones?: Array<{ code: string; name: string; airfireZoneId?: string | null }>
    points?: Array<{
      code: string
      name: string
      zoneCode: string
      latitude: number
      longitude: number
    }>
    extendedSnowLevelZones?: Array<{ zoneCode: string }>
  }
  structure?: MwfStructure
}

function isSnapshot(value: unknown): value is SnapshotShape {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeForecast(doc: MwfForecastDoc): MwfPublicForecast {
  const snapshot = isSnapshot(doc.publishSnapshot) ? doc.publishSnapshot : {}
  const config = snapshot.config ?? {}
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const body = (doc.body ?? {}) as Partial<SerializedForecast>
  return {
    id: doc.id,
    issuance: doc.issuance,
    serviceDate: doc.serviceDate,
    issuedAt: doc.issuedAt ?? null,
    createdAt: doc.createdAt,
    revision: doc.revision,
    isCorrection: doc.supersedes != null,
    body,
    config: {
      zones: zonesFromSettings(config.zones ?? []),
      points: pointsFromSettings(config.points ?? []),
      extendedZoneIds: (config.extendedSnowLevelZones ?? []).map((r) => r.zoneCode),
    },
    structure: snapshot.structure ?? MWF_STRUCTURE,
  }
}

export function createLocalPayloadMwfSource(payload: Payload, tenantId: number): MwfSource {
  return {
    async stackedForDate(date?: string) {
      const docs = await listVisibleForDate(payload, { tenantId, date })
      return docs.map(normalizeForecast)
    },
    async archiveIndex({ from, to, limit = 400 } = {}) {
      const rows = await chainRowsFor(payload, tenantId)
      const fromT = from ? new Date(from).getTime() : -Infinity
      const toT = to ? new Date(to).getTime() : Infinity
      return Array.from(visibleHeads(rows).values())
        .filter((row) => {
          const t = row.issuedAt ? new Date(row.issuedAt).getTime() : NaN
          return Number.isFinite(t) && t >= fromT && t <= toT
        })
        .sort((a, b) => {
          const at = a.issuedAt ? new Date(a.issuedAt).getTime() : 0
          const bt = b.issuedAt ? new Date(b.issuedAt).getTime() : 0
          return bt - at || b.id - a.id
        })
        .slice(0, limit)
        .map((row) => ({
          id: row.id,
          issuance: row.issuance,
          serviceDate: row.serviceDate,
          issuedAt: row.issuedAt,
          revision: row.revision,
        }))
    },
    async byId(id: number) {
      const doc = await getPublishedById(payload, { tenantId, id })
      return doc ? normalizeForecast(doc) : null
    },
  }
}
