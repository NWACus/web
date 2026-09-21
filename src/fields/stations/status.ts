import type { TrackedStation } from '@/services/snowobs/stationTracking'

// SnowObs's own station statuses, keyed on the latest observation: current,
// stale or unknown. Ours adds "not tracked" for a station on a page that has
// left the center's tracking list.
export type StationStatus = 'current' | 'stale' | 'unknown' | 'untracked'

// Loggers report hourly; a missed hour or two is still current.
export const STALE_AFTER_HOURS = 3

export const STATUS_LABEL: Record<StationStatus, string> = {
  current: 'Current',
  stale: 'Stale',
  unknown: 'Unknown',
  untracked: 'Not tracked',
}

export function stationStatus(
  station: TrackedStation | undefined,
  now = new Date(),
): StationStatus {
  if (!station?.tracked) return 'untracked'
  const observed = station.observedAt ? Date.parse(station.observedAt) : Number.NaN
  if (Number.isNaN(observed)) return 'unknown'
  return now.getTime() - observed <= STALE_AFTER_HOURS * 60 * 60 * 1000 ? 'current' : 'stale'
}
