import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { resolveSnowObsAccess } from './access'
import type { StationRef } from './stationKey'
import { stationKey } from './stationKey'
import type { TrackedStation } from './stationTracking'
import { fetchTrackedStations } from './stationTracking'

// Routes serving any tracked station check this list, so they don't proxy SnowObs for any stid.

/** Every station the center's SnowObs token tracks, cached an hour. */
export async function fetchCenterTrackedStations(center: string): Promise<TrackedStation[]> {
  const { token } = await resolveSnowObsAccess(center)
  return fetchTrackedStations(token)
}

export async function findTrackedStation(
  center: string,
  ref: StationRef,
): Promise<TrackedStation | null> {
  const key = stationKey(ref)
  const tracked = await fetchCenterTrackedStations(center)
  return tracked.find((station) => stationKey(station) === key) ?? null
}

/**
 * The station behind a detail page or its CSV route, or null for a center without stations or a
 * station it doesn't track. A SnowObs failure throws rather than reading as "not tracked".
 */
export async function findServedStation(
  center: string,
  ref: StationRef,
): Promise<TrackedStation | null> {
  if (!isValidTenantSlug(center)) return null
  const platforms = await getAvalancheCenterPlatforms(center)
  if (!platforms.stations) return null
  return findTrackedStation(center, ref)
}

/**
 * The requested `source:stid` keys that are neither in `allowed` nor tracked by the center.
 * Tracking is read only when a key falls outside `allowed`, so a station page's own graphs
 * don't wait on it.
 */
export async function unknownStationKeys(
  center: string,
  keys: string[],
  allowed: ReadonlySet<string> = new Set(),
): Promise<string[]> {
  const unlisted = keys.filter((key) => !allowed.has(key))
  if (unlisted.length === 0) return []
  const tracked = new Set((await fetchCenterTrackedStations(center)).map(stationKey))
  return unlisted.filter((key) => !tracked.has(key))
}
