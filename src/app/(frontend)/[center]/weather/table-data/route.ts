import {
  isPastRange,
  parseCustomRange,
  TABLE_CHUNK_DAYS,
} from '@/components/WeatherStations/stationPeriods'
import { STATION_DATA_CACHE_CONTROL } from '@/services/snowobs/access'
import { parseStationKey } from '@/services/snowobs/stationKey'
import { findServedStation } from '@/services/snowobs/trackedStations'
import { getStationPage } from '@/services/stations/getStationPages'
import { stationDataError } from '@/services/stations/stationDataError'
import {
  loadStationTables,
  PAST_RANGE_REVALIDATE,
  windowForDays,
} from '@/services/stations/stationTableData'
import { unknownCenterResponse } from '@/utilities/apiResponses'
import { centerTimezone, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { NextResponse } from 'next/server'

// Serves the Table tab's older days, a chunk at a time, for a long range. The token stays
// server-side, as in weather/graph-data, and only a page's or a tracked station's rows are served.

type Params = { center: string }

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

async function subjectOf(center: string, query: URLSearchParams) {
  const slug = query.get('page')
  if (slug) return getStationPage(center, slug)
  const ref = parseStationKey(query.get('station') ?? '')
  const station = ref && (await findServedStation(center, ref))
  return station ? { stations: [ref], columnOrder: [] } : null
}

// CRAP is inflated by the lack of unit coverage on this route handler; its range rules are tested
// through parseCustomRange.
// fallow-ignore-next-line complexity
export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  const { center } = await params
  if (!isValidTenantSlug(center)) return unknownCenterResponse()

  const query = new URL(request.url).searchParams
  const timeZone = centerTimezone(center)
  const now = new Date()
  const days = parseCustomRange(
    query.get('from') ?? undefined,
    query.get('to') ?? undefined,
    TABLE_CHUNK_DAYS,
    timeZone,
    now,
  )
  if (!days)
    return badRequest(`from/to must be up to ${TABLE_CHUNK_DAYS} days in an offered season`)

  try {
    const subject = await subjectOf(center, query)
    if (!subject) return NextResponse.json({ error: 'unknown stations' }, { status: 404 })
    const window = windowForDays(days, timeZone, now)
    const tables = await loadStationTables(center, subject, window, { chunked: true })
    const pastCache = `public, s-maxage=${PAST_RANGE_REVALIDATE}, stale-while-revalidate=${PAST_RANGE_REVALIDATE}`
    return NextResponse.json(tables, {
      headers: {
        'Cache-Control': isPastRange(days, timeZone) ? pastCache : STATION_DATA_CACHE_CONTROL,
      },
    })
  } catch (error) {
    return stationDataError('table-data', center, error)
  }
}
