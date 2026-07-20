import { DISPLAY_TIMEZONE, fallbackSensorLabel, SENSOR_LABELS, UNIT_LABELS } from './constants'
import type { SnowObsTimeseriesResponse } from './types/schemas'

// The graph engine's data contract (grill-me 2026-07-20): one shape feeds both
// the public station Graphs tab and the future self-serve builder. Series come
// back either raw (hourly points) or daily-aggregated — windows longer than
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
const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: DISPLAY_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function seriesLabel(stationName: string, variable: string): string {
  return `${stationName} · ${SENSOR_LABELS[variable] ?? fallbackSensorLabel(variable)}`
}

function seriesUnit(units: Record<string, string>, variable: string): string {
  const raw = units[variable]
  return raw ? (UNIT_LABELS[raw] ?? raw) : ''
}

// Time-ascending [ms, value] pairs for one station variable; null values kept
// so gaps render as gaps rather than interpolated lines.
function rawPoints(station: ResponseStation, variable: string): [number, number | null][] {
  const obs = station.observations
  const times = obs['date_time'] ?? []
  const values = obs[variable] ?? []
  const points: [number, number | null][] = []
  times.forEach((iso, i) => {
    const t = typeof iso === 'string' ? new Date(iso).getTime() : NaN
    if (!Number.isFinite(t)) return
    const v = values[i]
    points.push([t, typeof v === 'number' ? v : null])
  })
  points.sort((a, b) => a[0] - b[0])
  return points
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
  variable: string,
  units: Record<string, string>,
  aggregated: boolean,
): GraphSeries | null {
  if (!station.observations[variable]) return null
  const points = rawPoints(station, variable)
  if (points.length === 0) return null
  const base = {
    stid: station.stid,
    stationName: station.name ?? station.stid,
    variable,
    label: seriesLabel(station.name ?? station.stid, variable),
    unit: seriesUnit(units, variable),
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
  const days = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)
  return days > DECIMATION_THRESHOLD_DAYS
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
    for (const variable of variables) {
      const built = buildSeries(station, variable, response.UNITS, aggregated)
      if (built) series.push(built)
    }
  }
  return { series, aggregated, timezone: DISPLAY_TIMEZONE }
}
