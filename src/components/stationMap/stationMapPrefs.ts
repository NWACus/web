/**
 * The station-map settings that belong to the reader rather than to the view: units, the table's
 * sort, and whether the table colors readings that cross a threshold.
 *
 * The legacy widget cached the marker label, the recency filter, the units and the last viewport
 * per center in browser storage. All of those but units now ride in the URL (`./stationMapUrl`),
 * so a reader can bookmark or share what they are looking at, and nothing invisible outlives its
 * reason. Units stays here because "I read in metric" describes the reader, not the map — it
 * should hold across visits, and it should not be imposed on whoever opens a shared link. The
 * sort and the color toggle are the same kind of habit, and the widget kept them here too.
 */
import type { StationMapUnits } from '@/services/snowobs/stationMap/model'
import type { TableSort } from '@/services/snowobs/stationMap/table'

const UNITS: StationMapUnits[] = ['default', 'english', 'metric']

interface StationMapPrefs {
  units?: StationMapUnits
  colorRules?: boolean
  sort?: TableSort
}

function storageKey(centerSlug: string): string {
  return `avyweb-station-map-${centerSlug}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Only a unit we offer — a stale or hand-edited entry must not crash the map. */
function readUnits(value: unknown): StationMapUnits | undefined {
  return UNITS.find((known) => known === value)
}

function readSort(value: unknown): TableSort | undefined {
  if (!isRecord(value) || typeof value.column !== 'string' || value.column === '') return undefined
  if (value.direction !== 'asc' && value.direction !== 'desc') return undefined
  return { column: value.column, direction: value.direction }
}

/** What's stored, validated; anything unrecognised — including keys this module no longer owns — is dropped. */
function readPrefs(centerSlug: string): StationMapPrefs {
  try {
    const raw = window.localStorage.getItem(storageKey(centerSlug))
    const stored: unknown = raw ? JSON.parse(raw) : null
    if (!isRecord(stored)) return {}
    return {
      units: readUnits(stored.units),
      colorRules: typeof stored.colorRules === 'boolean' ? stored.colorRules : undefined,
      sort: readSort(stored.sort),
    }
  } catch {
    return {}
  }
}

function writePrefs(centerSlug: string, patch: StationMapPrefs): void {
  try {
    const next = { ...readPrefs(centerSlug), ...patch }
    window.localStorage.setItem(storageKey(centerSlug), JSON.stringify(next))
  } catch {
    // Private mode or a full quota: the preference just doesn't stick.
  }
}

export function readUnitsPref(centerSlug: string): StationMapUnits | undefined {
  return readPrefs(centerSlug).units
}

export function writeUnitsPref(centerSlug: string, units: StationMapUnits): void {
  writePrefs(centerSlug, { units })
}

export function readSortPref(centerSlug: string): TableSort | undefined {
  return readPrefs(centerSlug).sort
}

export function writeSortPref(centerSlug: string, sort: TableSort): void {
  writePrefs(centerSlug, { sort })
}

export function readColorRulesPref(centerSlug: string): boolean | undefined {
  return readPrefs(centerSlug).colorRules
}

export function writeColorRulesPref(centerSlug: string, colorRules: boolean): void {
  writePrefs(centerSlug, { colorRules })
}
