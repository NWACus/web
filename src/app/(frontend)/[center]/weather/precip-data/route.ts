import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { parseStationKeys, stationKey } from '@/services/snowobs/stationKey'
import { buildPrecipAccumulationTable } from '@/services/snowobs/tableHelpers'
import { unknownStationKeys } from '@/services/snowobs/trackedStations'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

// Serves the Precipitation Table block, as weather/graph-data serves the Graphs
// tab: the token stays server-side and the table keeps its own cadence.

const WINDOW_HOURS = 72
const REVALIDATE_SECONDS = 900
// A block's list is a handful of gauges; the cap only stops an open proxy.
const MAX_STATIONS = 60

type Params = { center: string }

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

// CRAP is inflated by the lack of unit coverage on this route handler; its
// parsing is tested through parseStationKeys.
// fallow-ignore-next-line complexity
export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  const { center } = await params
  if (!isValidTenantSlug(center)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const url = new URL(request.url)
  const requested = parseStationKeys(url.searchParams.get('stations'), MAX_STATIONS)
  if (typeof requested === 'string') return badRequest(requested)

  try {
    // This serves a center's own gauges, not whatever SnowObs will answer for.
    const strangers = await unknownStationKeys(center, requested.map(stationKey))
    if (strangers.length > 0) {
      return badRequest(`stations this center does not track: ${strangers.join(',')}`)
    }
    // One 72h fetch covers every trailing window (1H..72H are sums over it).
    const response = await fetchStationTimeseries(center, requested, {
      revalidate: REVALIDATE_SECONDS,
      windowHours: WINDOW_HOURS,
    })
    return NextResponse.json(buildPrecipAccumulationTable(center, response, requested), {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`,
      },
    })
  } catch (error) {
    // The message stays generic: a missing token or a SnowObs fault is ours to
    // read in the log, not the caller's. The fetch logs its own failures; this
    // names the route and catches everything it does not see.
    const payload = await getPayload({ config })
    payload.logger.error({ err: error, center }, 'precip-data failed')
    return NextResponse.json({ error: 'failed to load station data' }, { status: 502 })
  }
}
