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
  windowHours?: number
  revalidate?: number
}

/**
 * Fetch a timeseries for one or more SnowObs station ids over a trailing window
 * (default: last 24 hours). Runs server-side so the API token never reaches the
 * browser. Response is validated against the zod schema before returning.
 */
export async function fetchStationTimeseries(
  stids: string[],
  options: FetchOptions = {},
): Promise<SnowObsTimeseriesResponse> {
  const token = process.env.SNOWOBS_TOKEN
  if (!token) {
    throw new SnowObsError('SNOWOBS_TOKEN environment variable is not set')
  }
  const windowHours = options.windowHours ?? 24
  const end = new Date()
  const start = new Date(end.getTime() - windowHours * 60 * 60 * 1000)

  const params = new URLSearchParams({
    token,
    source: SOURCE,
    stid: stids.join(','),
    start_date: formatSnowObsDate(start),
    end_date: formatSnowObsDate(end),
  })
  const url = `${SNOWOBS_API}/station/data/timeseries/?${params.toString()}`

  try {
    const res = await fetch(url, {
      next: { revalidate: options.revalidate ?? 600 },
    })

    if (!res.ok) {
      throw new SnowObsError(`SnowObs request failed with status ${res.status}`, null, {
        stids,
        status: res.status,
        statusText: res.statusText,
      })
    }

    const json = await res.json()
    return snowObsTimeseriesResponseSchema.parse(json)
  } catch (error) {
    const payload = await getPayload({ config })
    payload.logger.error({ err: error, stids }, 'fetchStationTimeseries error')

    if (error instanceof SnowObsError) {
      throw error
    }
    throw new SnowObsError('Failed to fetch SnowObs station timeseries', error, { stids })
  }
}
