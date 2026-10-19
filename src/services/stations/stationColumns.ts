import { READING_NAMES, SENSOR_LABELS } from '@/services/snowobs/constants'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationColumnConfig } from '@/services/snowobs/tableHelpers'

// Kept free of the Payload config so the admin's column pickers can import it.

/** A station on a page: every reading it reports shows, new ones included, except `hidden`. */
export type StationEntry = StationRef & { hidden?: string[] }

/** One table column in a page's chosen order. */
export type ColumnOrderEntry = StationRef & { variable: string }

export function readingLabel(variable: string): string {
  return SENSOR_LABELS[variable] ?? variable
}

export function readingName(variable: string): string {
  return READING_NAMES[variable] ?? variable
}

/** How the stations table sums up a station's readings. */
export function readingsSummary(station: StationEntry, choices: string[]): string {
  const hidden = station.hidden ?? []
  if (hidden.length === 0)
    return choices.length > 0 ? `All readings · ${choices.length}` : 'All readings'
  if (choices.every((v) => hidden.includes(v))) return 'None'
  return `All except ${hidden.map(readingLabel).join(', ')}`
}

export function showsReading(station: StationEntry, variable: string): boolean {
  return !station.hidden?.includes(variable)
}

export function withHiddenReadings(station: StationEntry, hidden: string[]): StationEntry {
  const ref = { stid: station.stid, source: station.source }
  return hidden.length > 0 ? { ...ref, hidden } : ref
}

export function columnKey(station: StationRef, variable: string): string {
  return `${stationKey(station)}/${variable}`
}

function isColumnOrderEntry(value: unknown): value is ColumnOrderEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'stid' in value &&
    typeof value.stid === 'string' &&
    'source' in value &&
    typeof value.source === 'string' &&
    'variable' in value &&
    typeof value.variable === 'string'
  )
}

export function toColumnOrder(value: unknown): ColumnOrderEntry[] {
  return Array.isArray(value)
    ? value
        .filter(isColumnOrderEntry)
        .map(({ stid, source, variable }) => ({ stid, source, variable }))
    : []
}

// Drops the readings each station doesn't show.
export function selectColumns(
  columns: StationColumnConfig[],
  stations: StationEntry[],
): StationColumnConfig[] {
  const byKey = new Map(stations.map((s) => [stationKey(s), s]))
  return columns.filter(({ station, variable }) => {
    const entry = byKey.get(stationKey(station))
    return entry === undefined || showsReading(entry, variable)
  })
}

/**
 * The columns in the page's chosen order. A column the order does not list, such as a reading
 * just shown again or a sensor that started reporting, goes after the last column for its reading, or
 * at the end if there is none; an order entry with no column behind it is ignored.
 */
export function orderColumns(
  columns: StationColumnConfig[],
  order: ColumnOrderEntry[],
): StationColumnConfig[] {
  if (order.length === 0) return columns
  const byKey = new Map(columns.map((c) => [columnKey(c.station, c.variable), c]))
  const ordered = order.flatMap((o) => byKey.get(columnKey(o, o.variable)) ?? [])
  const listed = new Set(ordered)
  for (const column of columns) {
    if (listed.has(column)) continue
    const last = ordered.map((c) => c.variable).lastIndexOf(column.variable)
    if (last === -1) ordered.push(column)
    else ordered.splice(last + 1, 0, column)
  }
  return ordered
}

// Well-formed entries, no column twice. Exported so it can be tested without a form.
export function validateColumnOrder(value: unknown): true | string {
  if (value == null) return true
  if (!Array.isArray(value) || !value.every(isColumnOrderEntry)) {
    return 'Each column needs a SnowObs id, source and reading.'
  }
  const keys = value.map((o) => columnKey(o, o.variable))
  const repeat = keys.find((key, i) => keys.indexOf(key) !== i)
  return repeat ? `${repeat} is listed twice.` : true
}

// Drops entries for a station no longer on the page or a reading its station doesn't show.
export function pruneColumnOrder(
  order: ColumnOrderEntry[],
  stations: StationEntry[],
): ColumnOrderEntry[] {
  const onPage = new Map(stations.map((s) => [stationKey(s), s]))
  return order.filter((o) => {
    const station = onPage.get(stationKey(o))
    return station !== undefined && showsReading(station, o.variable)
  })
}

// What the column order field stores for an arrangement: nothing while it is the default.
export function orderToSave(
  next: StationColumnConfig[],
  defaults: StationColumnConfig[],
): ColumnOrderEntry[] {
  const isDefault = next.every(
    (c, i) =>
      columnKey(c.station, c.variable) === columnKey(defaults[i].station, defaults[i].variable),
  )
  return isDefault ? [] : toColumnOrderEntries(next)
}

export function toColumnOrderEntries(columns: StationColumnConfig[]): ColumnOrderEntry[] {
  return columns.map(({ station, variable }) => ({
    stid: station.stid,
    source: station.source,
    variable,
  }))
}
