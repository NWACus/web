import { READING_NAMES, SENSOR_LABELS } from '@/services/snowobs/constants'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationColumnConfig } from '@/services/snowobs/tableHelpers'

// Kept free of the Payload config so the admin's column pickers can import it.

/** A station on a page. `columns` lists the only readings its table shows; without it, every
 * reading it reports shows except those in `hidden`, new ones included. */
export type StationEntry = StationRef & { columns?: string[]; hidden?: string[] }

/** One table column in a page's chosen order. */
export type ColumnOrderEntry = StationRef & { variable: string }

export function readingLabel(variable: string): string {
  return SENSOR_LABELS[variable] ?? variable
}

export function readingName(variable: string): string {
  return READING_NAMES[variable] ?? variable
}

/** How the stations table sums up a station's readings: one wide pill, or a pill per reading. */
export function readingsSummary(
  station: StationEntry,
  choices: string[],
): { all: boolean; labels: string[] } {
  if (station.columns) {
    const shown = choices.filter((v) => station.columns?.includes(v)).map(readingLabel)
    return { all: false, labels: shown.length > 0 ? shown : ['None'] }
  }
  if (station.hidden?.length) {
    return { all: true, labels: [`All except ${station.hidden.map(readingLabel).join(', ')}`] }
  }
  return {
    all: true,
    labels: [choices.length > 0 ? `All readings · ${choices.length}` : 'All readings'],
  }
}

export function showsReading(station: StationEntry, variable: string): boolean {
  if (station.columns) return station.columns.includes(variable)
  return !station.hidden?.includes(variable)
}

/**
 * The station showing exactly `shown` of `choices`. While new readings show, it stores what is
 * hidden, so readings missing from `choices` (a later sensor, a timeseries-only one) still show.
 */
export function withShownReadings(
  station: StationEntry,
  choices: string[],
  shown: ReadonlySet<string>,
  showNew: boolean,
): StationEntry {
  const ref = { stid: station.stid, source: station.source }
  if (!showNew) return { ...ref, columns: choices.filter((v) => shown.has(v)) }
  const hidden = choices.filter((v) => !shown.has(v))
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
 * just ticked or a sensor that started reporting, goes after the last column for its reading, or
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

/**
 * The order to store for the columns as arranged. Entries the arrangement can't show, such as a
 * reading missing from a station's latest report, keep their place after the entry they followed.
 */
export function mergeOrder(
  stored: ColumnOrderEntry[],
  shown: StationColumnConfig[],
  stations: StationEntry[],
): ColumnOrderEntry[] {
  const merged = toColumnOrderEntries(shown)
  const keyOf = (o: ColumnOrderEntry) => columnKey(o, o.variable)
  const kept = new Set(merged.map(keyOf))
  const unseen = new Set(pruneColumnOrder(stored, stations).map(keyOf))
  stored.forEach((entry, i) => {
    if (kept.has(keyOf(entry)) || !unseen.has(keyOf(entry))) return
    const before = stored
      .slice(0, i)
      .reverse()
      .find((o) => kept.has(keyOf(o)))
    merged.splice(before ? merged.findIndex((o) => keyOf(o) === keyOf(before)) + 1 : 0, 0, entry)
    kept.add(keyOf(entry))
  })
  return merged
}

// What the column order field stores for an arrangement: nothing while it is the default.
export function orderToSave(
  next: StationColumnConfig[],
  defaults: StationColumnConfig[],
  stored: ColumnOrderEntry[],
  stations: StationEntry[],
): ColumnOrderEntry[] {
  const merged = mergeOrder(stored, next, stations)
  const isDefault =
    merged.length === defaults.length &&
    merged.every(
      (o, i) => columnKey(o, o.variable) === columnKey(defaults[i].station, defaults[i].variable),
    )
  return isDefault ? [] : merged
}

export function toColumnOrderEntries(columns: StationColumnConfig[]): ColumnOrderEntry[] {
  return columns.map(({ station, variable }) => ({
    stid: station.stid,
    source: station.source,
    variable,
  }))
}
