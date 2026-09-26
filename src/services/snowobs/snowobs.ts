import { tz } from '@date-fns/tz'
import config from '@payload-config'
import { format, subHours } from 'date-fns'
import { getPayload } from 'payload'
import { resolveSnowObsToken, SNOWOBS_API, SNOWOBS_ORIGIN_HEADER, SnowObsError } from './access'
import type {
  SnowObsCurrentGeojson,
  SnowObsTimeseriesResponse,
  SnowObsWebcamResponse,
} from './types/schemas'
import {
  snowObsCurrentGeojsonSchema,
  snowObsTimeseriesResponseSchema,
  snowObsWebcamResponseSchema,
} from './types/schemas'

export { SnowObsError } from './access'

import type { StationRef } from './stationKey'

export type { StationRef } from './stationKey'

// SnowObs expects UTC timestamps formatted as YYYYMMDDHHmm.
function formatSnowObsDate(date: Date): string {
  return format(date, 'yyyyMMddHHmm', { in: tz('UTC') })
}

type FetchOptions = {
  // Trailing-window fetch (used when start/end are omitted).
  windowHours?: number
  // Explicit window — overrides windowHours when provided.
  start?: Date
  end?: Date
  revalidate?: number
  // Skip SnowObs' default integer rounding (graphs want full precision).
  rawData?: boolean
}

// Build the timeseries request URL. Defaults to a trailing window (last 24h)
// with `end` floored to the revalidate bucket so the URL stays stable within a
// window (an un-bucketed `new Date()` defeats Next's fetch cache); an explicit
// start/end (CSV export) overrides the trailing window untouched.
// CRAP is inflated by the lack of unit coverage on this URL builder.
// fallow-ignore-next-line complexity
function buildTimeseriesUrl(stations: StationRef[], options: FetchOptions, token: string): string {
  const bucketMs = Math.max(options.revalidate ?? 600, 1) * 1000
  const endMs = Math.floor(Date.now() / bucketMs) * bucketMs
  const end = options.end ?? new Date(endMs)
  const start = options.start ?? subHours(end, options.windowHours ?? 24)

  // Both take comma lists; SnowObs returns each station tagged with its source.
  const params = new URLSearchParams({
    token,
    source: Array.from(new Set(stations.map((s) => s.source))).join(','),
    stid: stations.map((s) => s.stid).join(','),
    start_date: formatSnowObsDate(start),
    end_date: formatSnowObsDate(end),
  })
  if (options.rawData) params.set('raw_data', 'true')
  return `${SNOWOBS_API}/station/data/timeseries/?${params.toString()}`
}

// Best-effort logging: bootstrapping payload must never mask the original error. Named by call
// site, because the three SnowObs reads fail independently — a station-map outage should not read
// as a station-page one.
async function logSnowObsError(
  operation: string,
  error: unknown,
  context: Record<string, unknown>,
  level: 'error' | 'warn' = 'error',
): Promise<void> {
  try {
    const payload = await getPayload({ config })
    payload.logger[level]({ err: error, ...context }, `${operation} ${level}`)
  } catch {
    console.error(`${operation} error (payload logger unavailable)`, { ...context, error })
  }
}

// Validates an HTTP response into a typed timeseries, throwing SnowObsError on non-2xx.
async function parseTimeseriesResponse(
  res: Response,
  stids: string[],
): Promise<SnowObsTimeseriesResponse> {
  // SnowObs answers 404 when none of the requested stations exist any more.
  // For us that is an empty result, not a failure: the page renders with no
  // data and the admin flags the station as not tracked.
  if (res.status === 404) {
    return { UNITS: {}, VARIABLES: [], STATION: [] }
  }
  if (!res.ok) {
    throw new SnowObsError(`SnowObs request failed with status ${res.status}`, null, {
      stids,
      status: res.status,
      statusText: res.statusText,
    })
  }
  return snowObsTimeseriesResponseSchema.parse(await res.json())
}

// Preserves an existing SnowObsError; wraps anything else (network, zod, etc.).
function toSnowObsError(error: unknown, stids: string[]): SnowObsError {
  return error instanceof SnowObsError
    ? error
    : new SnowObsError('Failed to fetch SnowObs station timeseries', error, { stids })
}

// SnowObs 500s `raw_data` for some Synoptic airport stations (KSEA, KBLI…) but serves them
// rounded, as the legacy widget reads every station. Logged, since it rounds the whole request.
async function requestTimeseries(
  stations: StationRef[],
  options: FetchOptions,
  token: string,
  revalidate: number,
): Promise<Response> {
  const res = await fetch(buildTimeseriesUrl(stations, options, token), { next: { revalidate } })
  if (res.status !== 500 || !options.rawData) return res
  await res.body?.cancel()
  const stids = stations.map((s) => s.stid)
  await logSnowObsError('fetchStationTimeseries raw_data', null, { stids }, 'warn')
  const rounded = { ...options, rawData: false }
  return fetch(buildTimeseriesUrl(stations, rounded, token), { next: { revalidate } })
}

// Fetches a SnowObs timeseries server-side (token stays off the client) and validates it.
export async function fetchStationTimeseries(
  centerSlug: string,
  stations: StationRef[],
  options: FetchOptions = {},
): Promise<SnowObsTimeseriesResponse> {
  const revalidate = options.revalidate ?? 600
  const stids = stations.map((s) => s.stid)

  try {
    const token = await resolveSnowObsToken(centerSlug)
    const res = await requestTimeseries(stations, options, token, revalidate)
    return await parseTimeseriesResponse(res, stids)
  } catch (error) {
    await logSnowObsError('fetchStationTimeseries', error, { stids })
    throw toSnowObsError(error, stids)
  }
}

// --- Current conditions and webcams (the station map) ----------------------------------------

/** The units SnowObs reports in; `default` is whatever the center configured. */
export type SnowObsUnits = 'default' | 'english' | 'metric'

const WEBCAMS_REVALIDATE = 3600

// Shared by the current-data and webcam fetches: a non-2xx is a SnowObsError with the status.
async function checkedJson(res: Response, context: Record<string, unknown>): Promise<unknown> {
  if (!res.ok) {
    throw new SnowObsError(`SnowObs request failed with status ${res.status}`, null, {
      ...context,
      status: res.status,
      statusText: res.statusText,
    })
  }
  return res.json()
}

/**
 * Every station the center's token tracks, with its latest reading per sensor, as GeoJSON.
 *
 * This is the legacy station map's data call. Unlike the timeseries fetch above it is keyed on
 * the center: any center with `platforms.stations` has a token in its own AFP config, so the map
 * needs no per-center code. `calc_diff` asks for the 24-hour change columns the widget shows.
 *
 * Not cached here: SnowObs holds each response for 60s and the route's CDN for 60s more. A data
 * cache stacked on those served the first reader after a quiet spell whatever the last visit saw.
 */
export async function fetchCurrentStationData(
  centerSlug: string,
  units: SnowObsUnits = 'default',
): Promise<SnowObsCurrentGeojson> {
  try {
    const params = new URLSearchParams({
      token: await resolveSnowObsToken(centerSlug),
      calc_diff: 'true',
      units,
    })
    const res = await fetch(`${SNOWOBS_API}/station/data/current/?${params.toString()}`, {
      // The widget's exact URL, so the Origin header matters here most.
      headers: { accept: 'application/vnd.geo+json', ...SNOWOBS_ORIGIN_HEADER },
      cache: 'no-store',
    })
    return snowObsCurrentGeojsonSchema.parse(await checkedJson(res, { centerSlug, units }))
  } catch (error) {
    await logSnowObsError('fetchCurrentStationData', error, { centerSlug, units })
    throw error instanceof SnowObsError
      ? error
      : new SnowObsError('Failed to fetch SnowObs current station data', error, { centerSlug })
  }
}

/** The center's webcams, as the legacy station map shows them alongside the stations. */
export async function fetchWebcams(centerSlug: string): Promise<SnowObsWebcamResponse> {
  try {
    const params = new URLSearchParams({ token: await resolveSnowObsToken(centerSlug) })
    // A different API family from the weather endpoints — no `/wx` prefix.
    const res = await fetch(`https://api.snowobs.com/v1/webcam?${params.toString()}`, {
      headers: SNOWOBS_ORIGIN_HEADER,
      next: { revalidate: WEBCAMS_REVALIDATE },
    })
    return snowObsWebcamResponseSchema.parse(await checkedJson(res, { centerSlug }))
  } catch (error) {
    await logSnowObsError('fetchWebcams', error, { centerSlug })
    throw error instanceof SnowObsError
      ? error
      : new SnowObsError('Failed to fetch SnowObs webcams', error, { centerSlug })
  }
}
