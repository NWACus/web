/**
 * The one station-map setting that belongs to the reader rather than to the view: units.
 *
 * The legacy widget cached the marker label, the recency filter, the units and the last viewport
 * per center in browser storage. All of those but units now ride in the URL (`./stationMapUrl`),
 * so a reader can bookmark or share what they are looking at, and nothing invisible outlives its
 * reason. Units stays here because "I read in metric" describes the reader, not the map — it
 * should hold across visits, and it should not be imposed on whoever opens a shared link.
 */
import type { StationMapUnits } from '@/services/snowobs/stationMap/model'

const UNITS: StationMapUnits[] = ['default', 'english', 'metric']

function storageKey(centerSlug: string): string {
  return `avyweb-station-map-${centerSlug}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Only a unit we offer — a stale or hand-edited entry must not crash the map. */
function readUnits(value: unknown): StationMapUnits | undefined {
  if (!isRecord(value)) return undefined
  return UNITS.find((known) => known === value.units)
}

export function readUnitsPref(centerSlug: string): StationMapUnits | undefined {
  try {
    const raw = window.localStorage.getItem(storageKey(centerSlug))
    return raw ? readUnits(JSON.parse(raw)) : undefined
  } catch {
    return undefined
  }
}

export function writeUnitsPref(centerSlug: string, units: StationMapUnits): void {
  try {
    window.localStorage.setItem(storageKey(centerSlug), JSON.stringify({ units }))
  } catch {
    // Private mode or a full quota: the preference just doesn't stick.
  }
}
