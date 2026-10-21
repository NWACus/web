// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — see the sibling
// `forecast-archive` route, which carries the same waiver.
// fallow-ignore-file dynamic-segment-name-conflicts
import {
  findAdjacentDate,
  isWithinCalendar,
  latestValidDate,
  parseAdjacentQuery,
  type AdjacentQuery,
} from '@/services/nac/adjacentForecast'
import { buildZoneArchiveDates, forecastCalendarStart } from '@/services/nac/archiveDates'
import { fetchProductArchiveOrThrow, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { resolveDatedZoneFromSlug } from '@/services/nac/resolveZone'
import { NO_STORE } from '@/utilities/apiResponses'
import { nativeProductGate } from '@/utilities/nativeProductGate'
import { NextRequest, NextResponse } from 'next/server'

/** An older answer can't change; a newer one changes when the next forecast publishes. */
const CACHE_CONTROL = {
  older: 'public, s-maxage=1800, stale-while-revalidate=86400',
  newer: 'public, s-maxage=300',
}

type AdjacentSearch = { date: string | null } | { error: string; status: 400 | 404 }

const OUTSIDE_CALENDAR: AdjacentSearch = { error: 'Date outside the calendar', status: 400 }
const ZONE_NOT_FOUND: AdjacentSearch = { error: 'Zone not found', status: 404 }

/**
 * The adjacent date for a valid query, or the refusal to send. A date outside the calendar is
 * refused before the zone lookup or any archive read (`isWithinCalendar`). Throws when the archive
 * can't be read, which the caller must not mistake for "none".
 */
async function searchAdjacent(center: string, query: AdjacentQuery): Promise<AdjacentSearch> {
  const metadata = await getAvalancheCenterMetadata(center)
  const calendarStart = forecastCalendarStart(metadata.widget_config.forecast?.start_year)
  const latest = latestValidDate()
  if (!isWithinCalendar(query.date, calendarStart, latest)) return OUTSIDE_CALENDAR

  const zone = await resolveDatedZoneFromSlug(center, query.zoneSlug)
  if (!zone) return ZONE_NOT_FOUND

  const date = await findAdjacentDate({
    date: query.date,
    direction: query.direction,
    bound: query.direction === 'older' ? calendarStart : latest,
    fetchDates: async (window) => {
      const archive = await fetchProductArchiveOrThrow(center, window)
      return buildZoneArchiveDates(archive, zone.zone.id, metadata.timezone).map((d) => d.date)
    },
  })

  return { date }
}

/**
 * The date picker's arrows, past the months it has loaded: the zone's next older or newer
 * forecast date from `date`, searched month by month server-side (`findAdjacentDate`), or `null`
 * when there is none within the calendar's range. Asked only on an arrow click, so a page never
 * pays for it up front.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const blocked = await nativeProductGate(center, 'forecast')
  if (blocked) return blocked

  const { searchParams } = request.nextUrl
  const query = parseAdjacentQuery(
    searchParams.get('zone'),
    searchParams.get('date'),
    searchParams.get('dir'),
  )
  if (!query) {
    return NextResponse.json({ error: 'Invalid zone/date/dir parameters' }, { status: 400 })
  }

  let search: AdjacentSearch
  try {
    search = await searchAdjacent(center, query)
  } catch {
    // The picker keeps the arrow enabled and says so; a failure is never "no older forecast".
    return NextResponse.json({ error: 'Archive unavailable' }, { status: 502, headers: NO_STORE })
  }

  if ('error' in search) {
    return NextResponse.json({ error: search.error }, { status: search.status, headers: NO_STORE })
  }

  return NextResponse.json(
    { date: search.date },
    { headers: { 'Cache-Control': CACHE_CONTROL[query.direction] } },
  )
}
