import config from '@payload-config'
import { getPayload } from 'payload'
import type { SnowObsTimeseriesResponse } from './types/schemas'
import { snowObsTimeseriesResponseSchema } from './types/schemas'

const SNOWOBS_API = 'https://api.snowobs.com/wx/v1'
const SOURCE = 'nwac'

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
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`
  )
}

type FetchOptions = {
  // Trailing-window fetch (used when start/end are omitted).
  windowHours?: number
  // Explicit window — overrides windowHours when provided.
  start?: Date
  end?: Date
  revalidate?: number
}

// Build the timeseries request URL. Defaults to a trailing window (last 24h)
// with `end` floored to the revalidate bucket so the URL stays stable within a
// window (an un-bucketed `new Date()` defeats Next's fetch cache); an explicit
// start/end (CSV export) overrides the trailing window untouched.
// CRAP is inflated by the lack of unit coverage on this URL builder.
// fallow-ignore-next-line complexity
function buildTimeseriesUrl(stids: string[], options: FetchOptions): string {
  const token = process.env.SNOWOBS_TOKEN
  if (!token) {
    throw new SnowObsError('SNOWOBS_TOKEN environment variable is not set')
  }
  const bucketMs = Math.max(options.revalidate ?? 600, 1) * 1000
  const endMs = Math.floor(Date.now() / bucketMs) * bucketMs
  const end = options.end ?? new Date(endMs)
  const start =
    options.start ?? new Date(end.getTime() - (options.windowHours ?? 24) * 60 * 60 * 1000)

  const params = new URLSearchParams({
    token,
    source: SOURCE,
    stid: stids.join(','),
    start_date: formatSnowObsDate(start),
    end_date: formatSnowObsDate(end),
  })
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
  const url = buildTimeseriesUrl(stids, options)

  try {
    const res = await fetch(url, { next: { revalidate } })
    return await parseTimeseriesResponse(res, stids)
  } catch (error) {
    await logSnowObsError(error, stids)
    throw toSnowObsError(error, stids)
  }
}
