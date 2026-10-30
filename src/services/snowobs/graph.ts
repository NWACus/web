import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'
import { differenceInHours } from 'date-fns'
import { displayUnit } from './constants'
import type { StationRef } from './stationKey'
import { stationKey } from './stationKey'
import type { VariableRounding } from './stationTracking'
import type { SnowObsTimeseriesResponse } from './types/schemas'
import { roundTo, variableDecimals } from './units'

// The graph-data contract: series come back either raw (hourly points) or
// daily-aggregated — windows longer than DECIMATION_THRESHOLD_DAYS
// auto-aggregate server-side, no client knob.

export const DECIMATION_THRESHOLD_DAYS = 30

export type RawGraphSeries = {
  kind: 'raw'
  /** `source:stid` */
  key: string
  stid: string
  source: string
  stationName: string
  variable: string
  label: string
  unit: string
  /** The precision SnowObs rounds this variable to. */
  decimals: number
  /** [ms epoch, value|null] pairs, time-ascending. */
  points: [number, number | null][]
}

export type DailyGraphSeries = {
  kind: 'daily'
  key: string
  stid: string
  source: string
  stationName: string
  variable: string
  label: string
  unit: string
  decimals: number
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

// Daily-aggregation bucket key (yyyy-mm-dd, center timezone). Formatters are
// cached per zone because this runs per point in the aggregation loop.
const dayFormatters = new Map<string, Intl.DateTimeFormat>()

function dayFormatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = dayFormatters.get(timeZone)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  dayFormatters.set(timeZone, formatter)
  return formatter
}

// e.g. "Hurricane Ridge (5,250')" — the chart title already names the
// variable, so the legend just distinguishes stations.
function seriesLabel(station: ResponseStation): string {
  const name = station.name ?? station.stid
  return station.elevation != null ? `${name} (${station.elevation.toLocaleString()}')` : name
}

// date_time parsed and sorted once per station, not per variable.
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

// Nulls kept so gaps render as gaps rather than interpolated lines.
function rawPoints(
  times: ParsedTimes,
  values: (string | number | null)[],
): [number, number | null][] {
  return times.map(({ t, i }) => {
    const v = values[i]
    return [t, typeof v === 'number' ? v : null]
  })
}

// Per-day [dayStart, min, mean, max] rows, days as the given zone reckons them, held to the
// readings' precision. Circular variables get a vector mean with min/max pinned to it (no band).
export function aggregateDaily(
  points: [number, number | null][],
  timeZone: string,
  decimals: number,
  circular = false,
): [number, number, number, number][] {
  const dayFormatter = dayFormatterFor(timeZone)
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
    .map(({ t, values }) => dayRow(t, values, decimals, circular))
}

function dayRow(
  t: number,
  values: number[],
  decimals: number,
  circular: boolean,
): [number, number, number, number] {
  if (circular) {
    const mean = roundTo(vectorMeanDegrees(values), decimals)
    return [t, mean, mean, mean]
  }
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length
  return [t, Math.min(...values), roundTo(mean, decimals), Math.max(...values)]
}

// Vector (circular) mean of compass degrees — 350° and 10° average to 0°, not
// 180°. Ports the legacy compute_aggregates _vector_mean behavior.
export function vectorMeanDegrees(values: number[]): number {
  const toRad = Math.PI / 180
  const x = values.reduce((acc, d) => acc + Math.cos(d * toRad), 0)
  const y = values.reduce((acc, d) => acc + Math.sin(d * toRad), 0)
  const deg = (Math.atan2(y, x) * 180) / Math.PI
  // Two places clears the trig's float noise, so 350° and 10° land on 0, not 359.99….
  return roundTo((deg + 360) % 360, 2)
}

const CIRCULAR_VARIABLES = new Set(['wind_direction'])

function buildSeries(
  station: ResponseStation,
  times: ParsedTimes,
  variable: string,
  units: Record<string, string>,
  aggregated: boolean,
  timeZone: string,
  rounding: VariableRounding,
): GraphSeries | null {
  const values = station.observations[variable]
  if (!values) return null
  const points = rawPoints(times, values)
  if (points.length === 0) return null
  const decimals = variableDecimals(variable, values, rounding)
  const base = {
    key: stationKey(station),
    stid: station.stid,
    source: station.source,
    stationName: station.name ?? station.stid,
    variable,
    label: seriesLabel(station),
    unit: displayUnit(units[variable]),
    decimals,
  }
  if (aggregated) {
    return {
      kind: 'daily',
      ...base,
      days: aggregateDaily(points, timeZone, decimals, CIRCULAR_VARIABLES.has(variable)),
    }
  }
  return { kind: 'raw', ...base, points }
}

export function windowExceedsThreshold(from: Date, to: Date): boolean {
  return differenceInHours(to, from, { roundingMethod: 'ceil' }) > DECIMATION_THRESHOLD_DAYS * 24
}

export function buildGraphData(
  center: string,
  response: SnowObsTimeseriesResponse,
  stations: StationRef[],
  variables: string[],
  aggregated: boolean,
  rounding: VariableRounding = {},
): GraphData {
  const timeZone = centerTimezone(center)
  const byKey = new Map(response.STATION.map((s) => [stationKey(s), s]))
  const series: GraphSeries[] = []
  for (const ref of stations) {
    const station = byKey.get(stationKey(ref))
    if (!station) continue
    const times = parsedTimes(station)
    for (const variable of variables) {
      const built = buildSeries(
        station,
        times,
        variable,
        response.UNITS,
        aggregated,
        timeZone,
        rounding,
      )
      if (built) series.push(built)
    }
  }
  return { series, aggregated, timezone: timeZone }
}
