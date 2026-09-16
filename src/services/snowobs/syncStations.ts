import type { BasePayload } from 'payload'
import { resolveSnowObsAccess } from './snowobs'
import { fetchStationMetadata } from './stationMetadata'

export type StationSyncResult = {
  tenant: string
  source: string
  created: number
  updated: number
  unchanged: number
}

// SnowObs station identity moves a few times a year, so a day-old sync is fresh
// enough for the admin list to open on without asking SnowObs again.
export const SYNC_STALE_AFTER_HOURS = 24

export function syncIsDue(lastSyncedAt: string | null | undefined, now = new Date()): boolean {
  const ms = lastSyncedAt ? Date.parse(lastSyncedAt) : Number.NaN
  return Number.isNaN(ms) || now.getTime() - ms > SYNC_STALE_AFTER_HOURS * 60 * 60 * 1000
}

// Identity fields only. Editorial choices -- which page shows a station, whether
// its gauge is hidden from the precip table -- are never overwritten by the sync.
function identityFrom(station: {
  name?: string | null
  elevation?: number | null
  latitude?: number | null
  longitude?: number | null
  meta?: { weather_station_partner?: string | null } | null
}) {
  return {
    name: station.name ?? null,
    elevation: station.elevation ?? null,
    latitude: station.latitude ?? null,
    longitude: station.longitude ?? null,
    weatherStationPartner: station.meta?.weather_station_partner ?? null,
  }
}

type StationIdentity = ReturnType<typeof identityFrom>

function unchanged(existing: StationIdentity, next: StationIdentity): boolean {
  return (
    existing.name === next.name &&
    existing.elevation === next.elevation &&
    existing.latitude === next.latitude &&
    existing.longitude === next.longitude &&
    existing.weatherStationPartner === next.weatherStationPartner
  )
}

/**
 * Upsert every station SnowObs tracks for one tenant's source.
 *
 * Never deletes. A station that disappears upstream keeps its row, because a
 * page may point at it, and a station going quiet is a fault to report rather
 * than a reason to forget it existed.
 *
 * Matching is on (tenant, source, stid): `stid` alone is unique only within a
 * source, and a second center will bring its own.
 */
export async function syncStations(
  payload: BasePayload,
  {
    tenantId,
    tenantSlug,
    source,
    token,
  }: {
    tenantId: number
    tenantSlug: string
    source: string
    token: string
  },
): Promise<StationSyncResult> {
  const upstream = await fetchStationMetadata(source, token)

  const { docs: existing } = await payload.find({
    collection: 'stations',
    where: { and: [{ tenant: { equals: tenantId } }, { source: { equals: source } }] },
    limit: 1000,
    depth: 0,
  })
  const byStid = new Map(existing.map((doc) => [doc.stid, doc]))

  const result: StationSyncResult = {
    tenant: tenantSlug,
    source,
    created: 0,
    updated: 0,
    unchanged: 0,
  }
  const lastSyncedAt = new Date().toISOString()

  for (const station of upstream) {
    const identity = identityFrom(station)
    const current = byStid.get(station.stid)

    if (!current) {
      await payload.create({
        collection: 'stations',
        data: { ...identity, stid: station.stid, source, tenant: tenantId, lastSyncedAt },
        // A new row changes no page until someone assigns it one.
        context: { disableRevalidate: true },
      })
      result.created++
      continue
    }

    // An unchanged station still gets its timestamp, so "last synced" means
    // last checked, not last changed. No page reads the row, so skip the cache
    // bust; the write itself is cheap enough for a run that happens at most
    // once a day.
    if (
      unchanged(
        identityFrom({
          ...current,
          meta: { weather_station_partner: current.weatherStationPartner },
        }),
        identity,
      )
    ) {
      await payload.update({
        collection: 'stations',
        id: current.id,
        data: { lastSyncedAt },
        context: { disableRevalidate: true },
      })
      result.unchanged++
      continue
    }

    await payload.update({
      collection: 'stations',
      id: current.id,
      data: { ...identity, lastSyncedAt },
      context: { disableRevalidate: true },
    })
    result.updated++
  }

  return result
}

/**
 * Sync one center. The SnowObs source is the center's slug and the token is
 * the public one in its AFP config -- the same pair the pages read with, so a
 * sync that works here means the pages work too.
 */
export async function syncStationsForTenant(
  payload: BasePayload,
  tenant: { id: number; slug: string },
): Promise<StationSyncResult> {
  const { source, token } = await resolveSnowObsAccess(tenant.slug)
  return syncStations(payload, {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    source,
    token,
  })
}
