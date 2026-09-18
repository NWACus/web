import type { StationRef } from '@/services/snowobs/snowobs'
import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

type PageStations = { displayName: string; stations: StationRef[] }

function key(ref: StationRef): string {
  return `${ref.source}:${ref.stid}`
}

/**
 * A station belongs on one page. Returns the message for the first offence,
 * or null: a repeat within this page, or a station another page already shows.
 */
export function findStationConflict(
  stations: StationRef[],
  otherPages: PageStations[],
): string | null {
  const seen = new Set<string>()
  for (const ref of stations) {
    if (seen.has(key(ref))) return `${ref.stid} (${ref.source}) is listed twice on this page.`
    seen.add(key(ref))
  }
  const elsewhere = new Map<string, string>()
  for (const page of otherPages) {
    for (const ref of page.stations) elsewhere.set(key(ref), page.displayName)
  }
  for (const ref of stations) {
    const page = elsewhere.get(key(ref))
    if (page) return `${ref.stid} (${ref.source}) is already on the "${page}" page.`
  }
  return null
}

function refsOf(stations: unknown): StationRef[] {
  if (!Array.isArray(stations)) return []
  return stations.flatMap((s) =>
    s && typeof s.stid === 'string' && typeof s.source === 'string'
      ? [{ stid: s.stid, source: s.source }]
      : [],
  )
}

export const ensureStationsUnique: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const stations = refsOf(data?.stations)
  if (stations.length === 0) return data

  const tenant = data?.tenant ?? originalDoc?.tenant
  const tenantId = typeof tenant === 'object' && tenant ? tenant.id : tenant
  const currentId = data?.id ?? originalDoc?.id

  const { docs } = await req.payload.find({
    collection: 'stationPages',
    where: {
      and: [
        { tenant: { equals: tenantId } },
        ...(currentId != null ? [{ id: { not_equals: currentId } }] : []),
      ],
    },
    depth: 0,
    limit: 0,
    pagination: false,
    select: { displayName: true, stations: true },
    req,
  })

  const conflict = findStationConflict(
    stations,
    docs.map((doc) => ({ displayName: doc.displayName, stations: refsOf(doc.stations) })),
  )
  if (conflict) throw new APIError(conflict, 400)
  return data
}
