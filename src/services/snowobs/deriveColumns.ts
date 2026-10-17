import type { ColumnOrderEntry, StationEntry } from '@/services/stations/stationColumns'
import { orderColumns, selectColumns } from '@/services/stations/stationColumns'
import { TABLE_VARIABLE_ORDER } from './constants'
import type { StationRef } from './stationKey'
import { stationKey } from './stationKey'
import type { StationColumnConfig } from './tableHelpers'
import type { SnowObsTimeseriesResponse } from './types/schemas'

// Reported by most loggers but never a table column: it belongs on the battery
// graph and, later, the alerting, not next to the weather.
export const HIDDEN_TABLE_VARIABLES: ReadonlySet<string> = new Set(['battery_voltage'])

const NOT_A_READING: ReadonlySet<string> = new Set(['date_time'])

function rank(variable: string): number {
  const index = TABLE_VARIABLE_ORDER.findIndex((known) => known === variable)
  return index === -1 ? TABLE_VARIABLE_ORDER.length : index
}

function byTableOrder(a: string, b: string): number {
  return rank(a) - rank(b) || a.localeCompare(b)
}

// Every reading the loggers report, in fixed variable order, loggers in page
// order within each. Reproduces the legacy layout except for the two pages that
// hand-interleaved a pair of snow readings. `reportedBy` is the station's
// reported variables, from a timeseries response here or the tracking list in the admin.
export function columnsFromReported(
  stations: StationRef[],
  reportedBy: (station: StationRef) => Iterable<string>,
): StationColumnConfig[] {
  const reported = new Set<string>()
  const variablesByStation = new Map<string, Set<string>>()
  for (const station of stations) {
    const variables = new Set(
      Array.from(reportedBy(station)).filter(
        (v) => !NOT_A_READING.has(v) && !HIDDEN_TABLE_VARIABLES.has(v),
      ),
    )
    variablesByStation.set(stationKey(station), variables)
    variables.forEach((v) => reported.add(v))
  }

  const columns: StationColumnConfig[] = []
  for (const variable of Array.from(reported).sort(byTableOrder)) {
    for (const station of stations) {
      if (variablesByStation.get(stationKey(station))?.has(variable)) {
        columns.push({ station, variable })
      }
    }
  }
  return columns
}

export function deriveColumns(
  response: SnowObsTimeseriesResponse,
  stations: StationRef[],
): StationColumnConfig[] {
  const byKey = new Map(response.STATION.map((s) => [stationKey(s), s]))
  return columnsFromReported(stations, (station) =>
    Object.keys(byKey.get(stationKey(station))?.observations ?? {}),
  )
}

// What a station page's table shows: each station's chosen readings, in the page's column order.
export function resolveColumns(
  response: SnowObsTimeseriesResponse,
  page: { stations: StationEntry[]; columnOrder: ColumnOrderEntry[] },
): StationColumnConfig[] {
  const refs = page.stations.map(({ stid, source }) => ({ stid, source }))
  const columns = selectColumns(deriveColumns(response, refs), page.stations)
  return orderColumns(columns, page.columnOrder)
}
