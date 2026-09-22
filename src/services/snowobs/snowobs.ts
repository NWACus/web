import { tz } from '@date-fns/tz'
import config from '@payload-config'
import { format, subHours } from 'date-fns'
import { getPayload } from 'payload'
import { resolveSnowObsToken, SNOWOBS_API, SnowObsError } from './access'
import type { SnowObsTimeseriesResponse } from './types/schemas'
import { snowObsTimeseriesResponseSchema } from './types/schemas'

export { SnowObsError } from './access'

// A stid is unique only within a source, so the pair is the identity.
export type StationRef = { stid: string; source: string }

export function stationRefs(source: string, stids: string[]): StationRef[] {
  return stids.map((stid) => ({ stid, source }))
}

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

// Best-effort logging: bootstrapping payload must never mask the original error.
async function logSnowObsError(error: unknown, stids: string[]): Promise<void> {
  try {
    const payload = await getPayload({ config })
    payload.logger.error({ err: error, stids }, 'fetchStationTimeseries error')
  } catch {
    console.error('fetchStationTimeseries error (payload logger unavailable)', { stids, error })
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

// Fetches a SnowObs timeseries server-side (token stays off the client) and validates it.
export async function fetchStationTimeseries(
  centerSlug: string,
  stations: StationRef[],
  options: FetchOptions = {},
): Promise<SnowObsTimeseriesResponse> {
  const revalidate = options.revalidate ?? 600
  const stids = stations.map((s) => s.stid)

  try {
    const url = buildTimeseriesUrl(stations, options, await resolveSnowObsToken(centerSlug))
    const res = await fetch(url, { next: { revalidate } })
    return await parseTimeseriesResponse(res, stids)
  } catch (error) {
    await logSnowObsError(error, stids)
    throw toSnowObsError(error, stids)
  }
}
