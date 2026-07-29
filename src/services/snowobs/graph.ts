import { differenceInHours } from 'date-fns'
import { displayUnit, fallbackSensorLabel, NWAC_DISPLAY_TIMEZONE, SENSOR_LABELS } from './constants'
import type { SnowObsTimeseriesResponse } from './types/schemas'

// The graph engine's data contract: one shape feeds both the public station
// Graphs tab and the future self-serve builder. Series come back either raw
// (hourly points) or daily-aggregated — windows longer than
// DECIMATION_THRESHOLD_DAYS auto-aggregate server-side, no client knob.

export const DECIMATION_THRESHOLD_DAYS = 30

export type RawGraphSeries = {
  kind: 'raw'
  stid: string
  stationName: string
  variable: string
  label: string
  unit: string
  /** [ms epoch, value|null] pairs, time-ascending. */
  points: [number, number | null][]
}

export type DailyGraphSeries = {
  kind: 'daily'
  stid: string
  stationName: string
  variable: string
  label: string
  unit: string
  /** [day-start ms epoch (display TZ), min, mean, max], time-ascending. */
  days: [number, number, number, number][]
}

export type GraphSeries = RawGraphSeries | DailyGraphSeries

export type GraphData = {
  series: GraphSeries[]
  aggregated: boolean
  timezone: string
}

type ResponseStation = SnowObsTimeseriesResponse['STATION'][number]

// yyyy-mm-dd in the display timezone — the daily-aggregation bucket key.
// A cached Intl formatter (not date-fns `format` + tz) because this runs per
// point in the aggregation loop.
const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: NWAC_DISPLAY_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function seriesLabel(stationName: string, variable: string): string {
  return `${stationName} · ${SENSOR_LABELS[variable] ?? fallbackSensorLabel(variable)}`
}

// The station's date_time series parsed and time-sorted once, so building
// points doesn't re-parse and re-sort it for every variable.
type ParsedTimes = { t: number; i: number }[]

function parsedTimes(station: ResponseStation): ParsedTimes {
  const times = station.observations['date_time'] ?? []
  const parsed: ParsedTimes = []
  times.forEach((iso, i) => {
    const t = typeof iso === 'string' ? new Date(iso).getTime() : NaN
    if (Number.isFinite(t)) parsed.push({ t, i })
  })
  parsed.sort((a, b) => a.t - b.t)
  return parsed
}

// Time-ascending [ms, value] pairs for one station variable; null values kept
// so gaps render as gaps rather than interpolated lines.
function rawPoints(
  times: ParsedTimes,
  values: (string | number | null)[],
): [number, number | null][] {
  return times.map(({ t, i }) => {
    const v = values[i]
    return [t, typeof v === 'number' ? v : null]
  })
}

// Collapse raw points into per-day [dayStart, min, mean, max] rows (display
// timezone days); days with no numeric observations are omitted. Circular
// variables get a vector mean with min/max pinned to it (no meaningful band).
export function aggregateDaily(
  points: [number, number | null][],
  circular = false,
): [number, number, number, number][] {
  const byDay = new Map<string, { t: number; values: number[] }>()
  for (const [t, v] of points) {
    if (v === null) continue
    const key = dayFormatter.format(t)
    const bucket = byDay.get(key)
    if (bucket) {
      bucket.values.push(v)
      bucket.t = Math.min(bucket.t, t)
    } else {
      byDay.set(key, { t, values: [v] })
    }
  }
  return Array.from(byDay.values())
    .sort((a, b) => a.t - b.t)
    .map(({ t, values }) => dayRow(t, values, circular))
}

function dayRow(t: number, values: number[], circular: boolean): [number, number, number, number] {
  if (circular) {
    const mean = vectorMeanDegrees(values)
    return [t, mean, mean, mean]
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length
  return [t, round2(min), round2(mean), round2(max)]
}

function round2(v: number): number {
  return Number(v.toFixed(2))
}

// Vector (circular) mean of compass degrees — 350° and 10° average to 0°, not
// 180°. Ports the legacy compute_aggregates _vector_mean behavior.
export function vectorMeanDegrees(values: number[]): number {
  const toRad = Math.PI / 180
  const x = values.reduce((acc, d) => acc + Math.cos(d * toRad), 0)
  const y = values.reduce((acc, d) => acc + Math.sin(d * toRad), 0)
  const deg = (Math.atan2(y, x) * 180) / Math.PI
  return round2((deg + 360) % 360)
}

const CIRCULAR_VARIABLES = new Set(['wind_direction'])

function buildSeries(
  station: ResponseStation,
  times: ParsedTimes,
  variable: string,
  units: Record<string, string>,
  aggregated: boolean,
): GraphSeries | null {
  const values = station.observations[variable]
  if (!values) return null
  const points = rawPoints(times, values)
  if (points.length === 0) return null
  const base = {
    stid: station.stid,
    stationName: station.name ?? station.stid,
    variable,
    label: seriesLabel(station.name ?? station.stid, variable),
    unit: displayUnit(units[variable]),
  }
  if (aggregated) {
    return {
      kind: 'daily',
      ...base,
      days: aggregateDaily(points, CIRCULAR_VARIABLES.has(variable)),
    }
  }
  return { kind: 'raw', ...base, points }
}

export function windowExceedsThreshold(from: Date, to: Date): boolean {
  return differenceInHours(to, from, { roundingMethod: 'ceil' }) > DECIMATION_THRESHOLD_DAYS * 24
}

// One series per requested (station, variable) pair that actually has data.
export function buildGraphData(
  response: SnowObsTimeseriesResponse,
  stids: string[],
  variables: string[],
  aggregated: boolean,
): GraphData {
  const stationByStid = new Map(response.STATION.map((s) => [s.stid, s]))
  const series: GraphSeries[] = []
  for (const stid of stids) {
    const station = stationByStid.get(stid)
    if (!station) continue
    const times = parsedTimes(station)
    for (const variable of variables) {
      const built = buildSeries(station, times, variable, response.UNITS, aggregated)
      if (built) series.push(built)
    }
  }
  return { series, aggregated, timezone: NWAC_DISPLAY_TIMEZONE }
}
