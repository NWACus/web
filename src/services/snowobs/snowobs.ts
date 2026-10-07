import { tz } from '@date-fns/tz'
import config from '@payload-config'
import { format, subHours } from 'date-fns'
import { getPayload } from 'payload'
import { resolveSnowObsToken, SNOWOBS_API, SnowObsError, snowObsFetch } from './access'
import type { SnowObsTimeseriesResponse } from './types/schemas'
import { snowObsTimeseriesResponseSchema } from './types/schemas'

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
  // Data-cache lifetime; omitted means uncached so readings never lag SnowObs.
  revalidate?: number
  // Skip SnowObs' default integer rounding (graphs want full precision).
  rawData?: boolean
}

// A cached window floors `end` to its bucket so the URL stays stable.
// CRAP is inflated by the lack of unit coverage on this URL builder.
// fallow-ignore-next-line complexity
function buildTimeseriesUrl(stations: StationRef[], options: FetchOptions, token: string): string {
  const now = Date.now()
  const bucketMs = (options.revalidate ?? 0) * 1000
  const end = options.end ?? new Date(bucketMs ? Math.floor(now / bucketMs) * bucketMs : now)
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

// Best-effort logging: bootstrapping payload must never mask the original error.
async function logSnowObsError(
  error: unknown,
  stids: string[],
  level: 'error' | 'warn' = 'error',
): Promise<void> {
  try {
    const payload = await getPayload({ config })
    payload.logger[level]({ err: error, stids }, `fetchStationTimeseries ${level}`)
  } catch {
    console[level](`fetchStationTimeseries ${level} (payload logger unavailable)`, { stids, error })
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

async function requestTimeseries(
  stations: StationRef[],
  options: FetchOptions,
  token: string,
): Promise<SnowObsTimeseriesResponse> {
  const res = await snowObsFetch(
    buildTimeseriesUrl(stations, options, token),
    options.revalidate ? { next: { revalidate: options.revalidate } } : { cache: 'no-store' },
  )
  return parseTimeseriesResponse(
    res,
    stations.map((s) => s.stid),
  )
}

function mergeTimeseries(responses: SnowObsTimeseriesResponse[]): SnowObsTimeseriesResponse {
  const variables = new Map(responses.flatMap((r) => r.VARIABLES).map((v) => [v.variable, v]))
  return {
    UNITS: Object.assign({}, ...responses.map((r) => r.UNITS)),
    VARIABLES: Array.from(variables.values()),
    STATION: responses.flatMap((r) => r.STATION),
  }
}

// SnowObs 500s a raw_data request when a station reports a value its unit
// conversion can't take (KMHS's object-valued sky_condition); the rounded path
// skips that value, so the station comes back rounded instead of not at all.
async function retryRounded(
  stations: StationRef[],
  options: FetchOptions,
  token: string,
  error: unknown,
): Promise<SnowObsTimeseriesResponse> {
  if (!options.rawData) throw error
  await logSnowObsError(
    error,
    stations.map((s) => s.stid),
    'warn',
  )
  return requestTimeseries(stations, { ...options, rawData: false }, token)
}

async function requestStation(
  station: StationRef,
  options: FetchOptions,
  token: string,
): Promise<SnowObsTimeseriesResponse> {
  try {
    return await requestTimeseries([station], options, token)
  } catch (error) {
    return retryRounded([station], options, token, error)
  }
}

// Fetches a SnowObs timeseries server-side (token stays off the client) and validates it.
export async function fetchStationTimeseries(
  centerSlug: string,
  stations: StationRef[],
  options: FetchOptions = {},
): Promise<SnowObsTimeseriesResponse> {
  const stids = stations.map((s) => s.stid)

  try {
    const token = await resolveSnowObsToken(centerSlug)
    try {
      return await requestTimeseries(stations, options, token)
    } catch (error) {
      if (stations.length < 2) return await retryRounded(stations, options, token, error)
      // One station's bad data fails the whole batch, so retry each and keep
      // the ones that load, raw where they can be and rounded where not.
      const results = await Promise.allSettled(
        stations.map((station) => requestStation(station, options, token)),
      )
      const loaded = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
      if (loaded.length === 0) throw error
      await logSnowObsError(error, stids)
      return mergeTimeseries(loaded)
    }
  } catch (error) {
    await logSnowObsError(error, stids)
    throw toSnowObsError(error, stids)
  }
}
