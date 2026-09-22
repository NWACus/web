import { resolveSnowObsAccess } from '@/services/snowobs/access'
import { fetchStationTimeseries, SnowObsError } from '@/services/snowobs/snowobs'
import type { StationRef } from '@/services/snowobs/stationKey'
import { parseStationKeys, stationKey } from '@/services/snowobs/stationKey'
import { fetchTrackedStations } from '@/services/snowobs/stationTracking'
import { buildPrecipAccumulationTable } from '@/services/snowobs/tableHelpers'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

// Serves the Precipitation Table block, as weather/graph-data serves the Graphs
// tab. Reads SnowObs server-side so the token stays hidden, and keeps the
// table's refresh cadence off the page carrying it.

const WINDOW_HOURS = 72
const REVALIDATE_SECONDS = 900
// A block's list is a handful of gauges; the cap only stops an open proxy.
const MAX_STATIONS = 60

type Params = { center: string }

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

// Requested stations the center does not track: this serves a center's own
// gauges, not whatever SnowObs will answer for.
async function untracked(center: string, requested: StationRef[]): Promise<string[]> {
  const { token } = await resolveSnowObsAccess(center)
  const tracked = new Set((await fetchTrackedStations(token)).map(stationKey))
  return requested.map(stationKey).filter((key) => !tracked.has(key))
}

// CRAP is inflated by the lack of unit coverage on this route handler; its
// parsing is tested through parseStationKeys.
// fallow-ignore-next-line complexity
export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  const { center } = await params
  const url = new URL(request.url)
  const requested = parseStationKeys(url.searchParams.get('stations'), MAX_STATIONS)
  if (typeof requested === 'string') return badRequest(requested)

  try {
    const strangers = await untracked(center, requested)
    if (strangers.length > 0) {
      return badRequest(`stations this center does not track: ${strangers.join(',')}`)
    }
    // One 72h fetch covers every trailing window (1H..72H are sums over it).
    const response = await fetchStationTimeseries(center, requested, {
      revalidate: REVALIDATE_SECONDS,
      windowHours: WINDOW_HOURS,
    })
    return NextResponse.json(buildPrecipAccumulationTable(response, requested), {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`,
      },
    })
  } catch (error) {
    // A SnowObs failure is expected and the fetch has already logged it with the
    // stations it asked for; anything else is ours and would otherwise reach the
    // block as a grey notice with nothing recorded.
    if (error instanceof SnowObsError) {
      return NextResponse.json({ error: error.message }, { status: 502 })
    }
    const payload = await getPayload({ config })
    payload.logger.error({ err: error, center }, 'precip-data failed')
    return NextResponse.json({ error: 'failed to load station data' }, { status: 502 })
  }
}
