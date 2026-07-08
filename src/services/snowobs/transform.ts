import {
  DISPLAY_TIMEZONE,
  fallbackSensorLabel,
  PRECIP_CUMSUM,
  PRECIP_HOURLY,
  SENSOR_LABELS,
  UNIT_LABELS,
} from './constants'
import type { SnowObsObservations, SnowObsTimeseriesResponse } from './types/schemas'

// A [stid, variable] pair from the station registry describing one table column.
export type StationColumnConfig = [string, string]

export type TableColumn = {
  key: string // `${stid}_${variable}`
  stid: string
  variable: string
  label: string // short header, e.g. "Temp"
  longName: string // full name, e.g. "Air Temperature"
  unit: string // display unit, e.g. "°F"
  elevation: number | null
}

export type TableRow = {
  timestamp: number // ms epoch — stable row key and sort value
  display: string // "MM/DD HH:mm" in DISPLAY_TIMEZONE
  values: Record<string, number | null> // keyed by TableColumn.key
}

export type StationTable = {
  columns: TableColumn[]
  rows: TableRow[]
  timezoneLabel: string // e.g. "PDT"
  latestObservation: number | null // ms epoch of the most recent row, or null
}

/**
 * Running cumulative sum of hourly precipitation. Nulls pass through untouched
 * and do not advance the running total, matching the legacy plugin exactly.
 */
export function computePrecipCumsum(values: (number | null)[]): (number | null)[] {
  let sum = 0
  return values.map((v) => {
    if (v === null) return null
    sum += v
    return Number(sum.toFixed(2))
  })
}

// Coerce a raw observation series to numbers, mapping non-numeric entries to null.
function numericSeries(obs: SnowObsObservations, key: string): (number | null)[] | undefined {
  const raw = obs[key]
  if (!raw) return undefined
  return raw.map((v) => (typeof v === 'number' ? v : null))
}

// The date_time series as ISO strings, aligned index-for-index with sensor series.
function timeSeries(obs: SnowObsObservations): string[] {
  const raw = obs['date_time']
  if (!raw) return []
  return raw.map((v) => (typeof v === 'string' ? v : ''))
}

function formatDisplay(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DISPLAY_TIMEZONE,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`
}

function timezoneLabelFor(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DISPLAY_TIMEZONE,
    timeZoneName: 'short',
  }).formatToParts(new Date(iso))
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
}

function displayUnit(rawUnit: string | undefined): string {
  if (!rawUnit) return ''
  return UNIT_LABELS[rawUnit] ?? rawUnit
}

type ResponseStation = SnowObsTimeseriesResponse['STATION'][number]

// Numeric series for a config column; computes cumulative precip on the fly.
function columnSeries(
  station: ResponseStation | undefined,
  variable: string,
): (number | null)[] | undefined {
  if (!station) return undefined
  if (variable === PRECIP_CUMSUM) {
    const hourly = numericSeries(station.observations, PRECIP_HOURLY)
    return hourly ? computePrecipCumsum(hourly) : undefined
  }
  return numericSeries(station.observations, variable)
}

// Header metadata for a config column.
function columnMeta(
  stid: string,
  variable: string,
  station: ResponseStation | undefined,
  longNameByVariable: Map<string, string>,
  units: Record<string, string>,
): TableColumn {
  const isCumsum = variable === PRECIP_CUMSUM
  return {
    key: `${stid}_${variable}`,
    stid,
    variable,
    label: SENSOR_LABELS[variable] ?? fallbackSensorLabel(variable),
    longName: isCumsum
      ? 'Cumulative Precipitation'
      : (longNameByVariable.get(variable) ?? variable),
    unit: isCumsum ? 'in' : displayUnit(units[variable]),
    elevation: station?.elevation ?? null,
  }
}

/**
 * Combine a SnowObs timeseries response with a station group's column config into
 * a render-ready table: newest-first hourly rows aligned across all stations in
 * the group (full outer join on timestamp), with a computed cumulative-precip
 * column auto-inserted after each hourly-precip column.
 */
export function buildStationTable(
  response: SnowObsTimeseriesResponse,
  columnConfig: StationColumnConfig[],
): StationTable {
  const stationByStid = new Map(response.STATION.map((s) => [s.stid, s]))
  const longNameByVariable = new Map(response.VARIABLES.map((v) => [v.variable, v.long_name]))

  const columns: TableColumn[] = []
  // Per-column lookup from ISO timestamp -> value, plus the union of all timestamps.
  const valueByColumn = new Map<string, Map<string, number | null>>()
  const allTimes = new Set<string>()

  const addColumn = (stid: string, variable: string) => {
    const key = `${stid}_${variable}`
    if (valueByColumn.has(key)) return // de-dupe (e.g. explicit + auto-inserted cumsum)

    const station = stationByStid.get(stid)
    const series = columnSeries(station, variable)

    // Unknown variable with no data and not in the response's variable list — skip
    // it, mirroring the legacy plugin which logs and drops such columns.
    if (!series && !longNameByVariable.has(variable) && variable !== PRECIP_CUMSUM) return

    columns.push(columnMeta(stid, variable, station, longNameByVariable, response.UNITS))

    const lookup = new Map<string, number | null>()
    if (station && series) {
      const times = timeSeries(station.observations)
      times.forEach((t, i) => {
        lookup.set(t, series[i] ?? null)
        allTimes.add(t)
      })
    }
    valueByColumn.set(key, lookup)
  }

  for (const [stid, variable] of columnConfig) {
    if (variable === PRECIP_CUMSUM) continue // inserted automatically after hourly precip
    addColumn(stid, variable)
    if (variable === PRECIP_HOURLY) addColumn(stid, PRECIP_CUMSUM)
  }

  // Newest-first rows across the union of all observed timestamps.
  const sortedTimes = Array.from(allTimes).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  )

  const rows: TableRow[] = sortedTimes.map((iso) => {
    const values: Record<string, number | null> = {}
    for (const column of columns) {
      values[column.key] = valueByColumn.get(column.key)?.get(iso) ?? null
    }
    return { timestamp: new Date(iso).getTime(), display: formatDisplay(iso), values }
  })

  return {
    columns,
    rows,
    timezoneLabel: sortedTimes.length > 0 ? timezoneLabelFor(sortedTimes[0]) : '',
    latestObservation: rows.length > 0 ? rows[0].timestamp : null,
  }
}
