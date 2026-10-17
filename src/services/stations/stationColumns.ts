import { SENSOR_LABELS } from '@/services/snowobs/constants'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationColumnConfig } from '@/services/snowobs/tableHelpers'

// Kept free of the Payload config so the admin's column pickers can import it.

/** A station on a page; `columns` are the readings its table shows, or absent for all it reports. */
export type StationEntry = StationRef & { columns?: string[] }

/** One table column in a page's chosen order. */
export type ColumnOrderEntry = StationRef & { variable: string }

export function readingLabel(variable: string): string {
  return SENSOR_LABELS[variable] ?? variable
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

// Drops the readings a station has not chosen; a station without a choice keeps all of them.
export function selectColumns(
  columns: StationColumnConfig[],
  stations: StationEntry[],
): StationColumnConfig[] {
  const chosen = new Map(stations.map((s) => [stationKey(s), s.columns]))
  return columns.filter(({ station, variable }) => {
    const columns = chosen.get(stationKey(station))
    return columns === undefined || columns.includes(variable)
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

// What the column order field stores for an arrangement: nothing while it is the default.
export function orderToSave(
  next: StationColumnConfig[],
  defaults: StationColumnConfig[],
): ColumnOrderEntry[] {
  const isDefault =
    next.length === defaults.length &&
    next.every(
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
