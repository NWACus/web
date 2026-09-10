/**
 * The reader's station-map preferences, kept in `localStorage` as the legacy widget kept them.
 *
 * The widget persisted the marker label, the recency filter, the units and the last viewport per
 * center, so a reader who set "show air temperature" saw it on every visit. Source, type and zone
 * filters were session-only (zone rides in the URL instead), and stay that way.
 */
import { WITHIN_OPTIONS } from '@/services/snowobs/stationMap/filters'
import type { StationMapUnits } from '@/services/snowobs/stationMap/model'

export interface StationMapPrefs {
  variable?: string
  withinMinutes?: number
  units?: StationMapUnits
  center?: { lat: number; lng: number }
  zoom?: number
}

const UNITS: StationMapUnits[] = ['default', 'english', 'metric']

function storageKey(centerSlug: string): string {
  return `avyweb-station-map-${centerSlug}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** Only a recency the filter offers: anything else would select no radio and chip as a number. */
function offeredWithin(value: unknown): number | undefined {
  const within = finite(value)
  return WITHIN_OPTIONS.some((option) => option.value === within) ? within : undefined
}

/** Only the fields we wrote, each checked — a stale or hand-edited entry must not crash the map. */
function sanitize(value: unknown): StationMapPrefs {
  if (!isRecord(value)) return {}
  const prefs: StationMapPrefs = {}

  if (typeof value.variable === 'string') prefs.variable = value.variable
  const within = offeredWithin(value.withinMinutes)
  if (within !== undefined) prefs.withinMinutes = within
  const units = UNITS.find((known) => known === value.units)
  if (units) prefs.units = units
  const zoom = finite(value.zoom)
  if (zoom !== undefined) prefs.zoom = zoom
  if (isRecord(value.center)) {
    const lat = finite(value.center.lat)
    const lng = finite(value.center.lng)
    if (lat !== undefined && lng !== undefined) prefs.center = { lat, lng }
  }

  return prefs
}

export function readStationMapPrefs(centerSlug: string): StationMapPrefs {
  try {
    const raw = window.localStorage.getItem(storageKey(centerSlug))
    return raw ? sanitize(JSON.parse(raw)) : {}
  } catch {
    return {}
  }
}

/** Merge only the fields the patch sets: an `undefined` must not erase a saved preference. */
export function writeStationMapPrefs(centerSlug: string, patch: StationMapPrefs): void {
  try {
    const next = { ...readStationMapPrefs(centerSlug), ...sanitize(patch) }
    window.localStorage.setItem(storageKey(centerSlug), JSON.stringify(next))
  } catch {
    // Private mode or a full quota: the preference just doesn't stick.
  }
}

export function clearStationMapPrefs(centerSlug: string): void {
  try {
    window.localStorage.removeItem(storageKey(centerSlug))
  } catch {
    // Nothing to clear, or nowhere to clear it from.
  }
}

// --- The zone filter rides in the URL, so a filtered map can be linked to. ---------------------

const ZONE_PARAM = 'zone'

export function readZoneParam(search: string): string[] {
  return new URLSearchParams(search).getAll(ZONE_PARAM).filter((zone) => zone.length > 0)
}

/** The same URL with the zone filter replaced; `''` for the querystring when there is none. */
export function withZoneParam(search: string, zones: string[]): string {
  const params = new URLSearchParams(search)
  params.delete(ZONE_PARAM)
  for (const zone of zones) params.append(ZONE_PARAM, zone)
  const query = params.toString()
  return query ? `?${query}` : ''
}
