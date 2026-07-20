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
  label: string
  longName: string
  unit: string
  elevation: number | null
}

export type TableRow = {
  timestamp: number // ms epoch
  display: string // "MM/DD HH:mm" in DISPLAY_TIMEZONE
  values: Record<string, number | null> // keyed by TableColumn.key
}

export type StationTable = {
  columns: TableColumn[]
  rows: TableRow[]
  timezoneLabel: string
  latestObservation: number | null
}

// Running cumulative precip; nulls pass through and don't advance the total.
export function computePrecipCumsum(values: (number | null)[]): (number | null)[] {
  let sum = 0
  return values.map((v) => {
    if (v === null) return null
    sum += v
    return Number(sum.toFixed(2))
  })
}

// Raw observation series as numbers (non-numeric entries → null).
function numericSeries(obs: SnowObsObservations, key: string): (number | null)[] | undefined {
  const raw = obs[key]
  if (!raw) return undefined
  return raw.map((v) => (typeof v === 'number' ? v : null))
}

// date_time as ISO strings, index-aligned with the sensor series.
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

// --- Accumulated Precipitation (legacy /data-portal/accumulations/) --------

// Trailing windows shown as columns, matching the legacy page.
export const PRECIP_ACCUMULATION_WINDOWS = [1, 3, 6, 12, 24, 48, 72] as const

export type PrecipAccumulationRow = {
  stid: string
  name: string
  latitude: number | null
  elevation: number | null
  /** Latest report in DISPLAY_TIMEZONE ("MM/DD HH:mm"), '' when never reported. */
  lastUpdate: string
  /** Latest report as ms epoch (null when never reported) — sortable form. */
  lastUpdateMs: number | null
  /** Window hours -> inches summed over the trailing window; null = no
   * observations inside that window. */
  totals: Record<number, number | null>
  /** False when the station reported nothing in the widest window ("missing"). */
  hasData: boolean
}

export type PrecipAccumulationTable = {
  rows: PrecipAccumulationRow[]
  timezoneLabel: string
}

// One row per requested station, sorted north -> south (latitude desc, like the
// legacy table), summing hourly precip over each trailing window. Windows are
// anchored at the newest observation across ALL stations so a lagging logger
// shows a stale lastUpdate rather than shifting everyone's window.
// Newest valid timestamp in a series (0 when none).
function latestMs(times: string[]): number {
  return times.reduce((max, iso) => {
    const t = new Date(iso).getTime()
    return Number.isFinite(t) && t > max ? t : max
  }, 0)
}

// Sum of non-null hourly values observed after `cutoff`; null when none.
function trailingSum(times: string[], hourly: (number | null)[], cutoff: number): number | null {
  let sum = 0
  let observed = false
  times.forEach((iso, i) => {
    const v = hourly[i]
    if (v === null || v === undefined) return
    const t = new Date(iso).getTime()
    if (!Number.isFinite(t) || t <= cutoff) return
    sum += v
    observed = true
  })
  return observed ? Number(sum.toFixed(2)) : null
}

function accumulationRow(
  stid: string,
  station: ResponseStation,
  anchorMs: number,
): PrecipAccumulationRow {
  const times = timeSeries(station.observations)
  const hourly = numericSeries(station.observations, PRECIP_HOURLY) ?? []
  const lastMs = latestMs(times)

  const totals: Record<number, number | null> = {}
  for (const hours of PRECIP_ACCUMULATION_WINDOWS) {
    totals[hours] = trailingSum(times, hourly, anchorMs - hours * 60 * 60 * 1000)
  }

  return {
    stid,
    name: station.name ?? stid,
    latitude: station.latitude ?? null,
    elevation: station.elevation ?? null,
    lastUpdate: lastMs > 0 ? formatDisplay(new Date(lastMs).toISOString()) : '',
    lastUpdateMs: lastMs > 0 ? lastMs : null,
    totals,
    hasData: Object.values(totals).some((v) => v !== null),
  }
}

// North -> south; stations without a latitude sink to the bottom by name.
function northToSouth(a: PrecipAccumulationRow, b: PrecipAccumulationRow): number {
  if (a.latitude != null && b.latitude != null) return b.latitude - a.latitude
  if (a.latitude != null) return -1
  if (b.latitude != null) return 1
  return a.name.localeCompare(b.name)
}

export function buildPrecipAccumulationTable(
  response: SnowObsTimeseriesResponse,
  stids: string[],
): PrecipAccumulationTable {
  const stationByStid = new Map(response.STATION.map((s) => [s.stid, s]))
  const stations = Array.from(new Set(stids)).flatMap((stid) => {
    const station = stationByStid.get(stid)
    return station ? [{ stid, station }] : []
  })

  // Windows anchor at the newest observation across ALL stations, so a lagging
  // logger shows a stale lastUpdate rather than shifting everyone's window.
  const anchorMs = Math.max(
    0,
    ...stations.map(({ station }) => latestMs(timeSeries(station.observations))),
  )
  const withTimes = stations.find(({ station }) => timeSeries(station.observations).length > 0)

  return {
    rows: stations
      .map(({ stid, station }) => accumulationRow(stid, station, anchorMs))
      .sort(northToSouth),
    timezoneLabel: withTimes ? timezoneLabelFor(timeSeries(withTimes.station.observations)[0]) : '',
  }
}

// Builds a render-ready table: newest-first rows, full-outer-joined across the
// group's stations, with a cumulative-precip column after each hourly-precip one.
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
