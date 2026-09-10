import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { tz } from '@date-fns/tz'
import config from '@payload-config'
import { format, subHours } from 'date-fns'
import { getPayload } from 'payload'
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

const SNOWOBS_API = 'https://api.snowobs.com/wx/v1'
// Doubles as the center slug whose AFP config carries the token; #1169 splits the
// two when a second center gets these pages.
const NWAC_SOURCE = 'nwac'

export class SnowObsError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'SnowObsError'
  }
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

// The token lives in the center's AFP config (`widget_config.stations.token`), the same
// public token the legacy stations widget uses. It is the only source — no env override.
async function resolveSnowObsTokenFor(centerSlug: string): Promise<string> {
  const metadata = await getAvalancheCenterMetadata(centerSlug)
  const token = metadata.widget_config.stations?.token
  if (!token) {
    throw new SnowObsError(`No SnowObs token in the AFP config for ${centerSlug}`)
  }
  return token
}

// The station pages are NWAC's loggers, so their token is NWAC's; #1169 makes this per center.
function resolveSnowObsToken(): Promise<string> {
  return resolveSnowObsTokenFor(NWAC_SOURCE)
}

// Build the timeseries request URL. Defaults to a trailing window (last 24h)
// with `end` floored to the revalidate bucket so the URL stays stable within a
// window (an un-bucketed `new Date()` defeats Next's fetch cache); an explicit
// start/end (CSV export) overrides the trailing window untouched.
// CRAP is inflated by the lack of unit coverage on this URL builder.
// fallow-ignore-next-line complexity
function buildTimeseriesUrl(stids: string[], options: FetchOptions, token: string): string {
  const bucketMs = Math.max(options.revalidate ?? 600, 1) * 1000
  const endMs = Math.floor(Date.now() / bucketMs) * bucketMs
  const end = options.end ?? new Date(endMs)
  const start = options.start ?? subHours(end, options.windowHours ?? 24)

  const params = new URLSearchParams({
    token,
    source: NWAC_SOURCE,
    stid: stids.join(','),
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
  stids: string[],
  options: FetchOptions = {},
): Promise<SnowObsTimeseriesResponse> {
  const revalidate = options.revalidate ?? 600

  try {
    const url = buildTimeseriesUrl(stids, options, await resolveSnowObsToken())
    const res = await fetch(url, { next: { revalidate } })
    return await parseTimeseriesResponse(res, stids)
  } catch (error) {
    await logSnowObsError(error, stids)
    throw toSnowObsError(error, stids)
  }
}

// --- Current conditions and webcams (the station map) ----------------------------------------

/** The units SnowObs reports in; `default` is whatever the center configured. */
export type SnowObsUnits = 'default' | 'english' | 'metric'

const CURRENT_DATA_REVALIDATE = 300
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
 */
export async function fetchCurrentStationData(
  centerSlug: string,
  units: SnowObsUnits = 'default',
): Promise<SnowObsCurrentGeojson> {
  try {
    const params = new URLSearchParams({
      token: await resolveSnowObsTokenFor(centerSlug),
      calc_diff: 'true',
      units,
    })
    const res = await fetch(`${SNOWOBS_API}/station/data/current/?${params.toString()}`, {
      headers: { accept: 'application/vnd.geo+json' },
      next: { revalidate: CURRENT_DATA_REVALIDATE },
    })
    return snowObsCurrentGeojsonSchema.parse(await checkedJson(res, { centerSlug, units }))
  } catch (error) {
    await logSnowObsError(error, [])
    throw error instanceof SnowObsError
      ? error
      : new SnowObsError('Failed to fetch SnowObs current station data', error, { centerSlug })
  }
}

/** The center's webcams, as the legacy station map shows them alongside the stations. */
export async function fetchWebcams(centerSlug: string): Promise<SnowObsWebcamResponse> {
  try {
    const params = new URLSearchParams({ token: await resolveSnowObsTokenFor(centerSlug) })
    // A different API family from the weather endpoints — no `/wx` prefix.
    const res = await fetch(`https://api.snowobs.com/v1/webcam?${params.toString()}`, {
      next: { revalidate: WEBCAMS_REVALIDATE },
    })
    return snowObsWebcamResponseSchema.parse(await checkedJson(res, { centerSlug }))
  } catch (error) {
    await logSnowObsError(error, [])
    throw error instanceof SnowObsError
      ? error
      : new SnowObsError('Failed to fetch SnowObs webcams', error, { centerSlug })
  }
}
