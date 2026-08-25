import type { BasePayload } from 'payload'
import { fetchStationMetadata } from './stationMetadata'

export type StationSyncResult = {
  tenant: string
  source: string
  created: number
  updated: number
  unchanged: number
}

// Identity fields only. Editorial choices -- which readings a station
// contributes, which pages show it -- are never overwritten by the sync.
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
 * Upsert every station SnowObs holds for one tenant's source.
 *
 * Never deletes. A station that disappears upstream keeps its row, because
 * groups and -- later -- alert rules point at it, and a station going quiet is
 * a fault to report rather than a reason to forget it existed.
 *
 * Matching is on (tenant, source, stid): `stid` alone is unique only within a
 * source, and the second center will bring its own.
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
      })
      result.created++
      continue
    }

    // Skip no-op writes: the database is remote SQLite, so every update is a
    // round trip, and station identity changes about never.
    if (
      unchanged(
        identityFrom({
          ...current,
          meta: { weather_station_partner: current.weatherStationPartner },
        }),
        identity,
      )
    ) {
      result.unchanged++
      continue
    }

    await payload.update({
      collection: 'stations',
      id: current.id,
      data: { ...identity, lastSyncedAt },
    })
    result.updated++
  }

  return result
}
