import { TABLE_VARIABLE_ORDER } from './constants'
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

/**
 * The table columns for a page, derived from what its loggers actually report.
 *
 * SnowObs knows which sensors each logger carries; the page only decides which
 * loggers it shows and in what order. So the columns are every reported
 * variable, in a fixed variable order, loggers in page order within each --
 * which reproduces the legacy layout for every page except the two that
 * hand-interleaved a pair of snow readings.
 */
export function deriveColumns(
  response: SnowObsTimeseriesResponse,
  stids: string[],
): StationColumnConfig[] {
  const stationByStid = new Map(response.STATION.map((s) => [s.stid, s]))

  const reported = new Set<string>()
  const variablesByStid = new Map<string, Set<string>>()
  for (const stid of stids) {
    const observations = stationByStid.get(stid)?.observations ?? {}
    const variables = new Set(
      Object.keys(observations).filter(
        (v) => !NOT_A_READING.has(v) && !HIDDEN_TABLE_VARIABLES.has(v),
      ),
    )
    variablesByStid.set(stid, variables)
    variables.forEach((v) => reported.add(v))
  }

  const columns: StationColumnConfig[] = []
  for (const variable of Array.from(reported).sort(byTableOrder)) {
    for (const stid of stids) {
      if (variablesByStid.get(stid)?.has(variable)) columns.push([stid, variable])
    }
  }
  return columns
}

// A page's table columns: the derived set, narrowed to the readings the page
// chose when it chose any.
export function resolveColumns(
  response: SnowObsTimeseriesResponse,
  page: { stids: string[]; columns: string[] },
): StationColumnConfig[] {
  const derived = deriveColumns(response, page.stids)
  if (page.columns.length === 0) return derived
  const chosen = new Set<string>(page.columns)
  return derived.filter(([, variable]) => chosen.has(variable))
}
