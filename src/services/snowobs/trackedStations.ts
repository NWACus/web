import { resolveSnowObsAccess } from './access'
import type { StationRef } from './stationKey'
import { stationKey } from './stationKey'
import type { TrackedStation } from './stationTracking'
import { fetchTrackedStations } from './stationTracking'

// The routes that serve any station the center tracks, rather than only those on
// its station pages, check against this list so they don't proxy SnowObs for
// any stid our token can read.

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
