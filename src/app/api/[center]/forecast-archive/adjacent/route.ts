// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — see the sibling
// `forecast-archive` route, which carries the same waiver.
// fallow-ignore-file dynamic-segment-name-conflicts
import {
  findAdjacentDate,
  latestValidDate,
  parseAdjacentQuery,
  type AdjacentQuery,
} from '@/services/nac/adjacentForecast'
import { buildZoneArchiveDates, forecastCalendarStart } from '@/services/nac/archiveDates'
import { fetchProductArchiveOrThrow, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { NO_STORE } from '@/utilities/apiResponses'
import { nativeProductGate } from '@/utilities/nativeProductGate'
import { NextRequest, NextResponse } from 'next/server'

/** An older answer can't change; a newer one changes when the next forecast publishes. */
const CACHE_CONTROL = {
  older: 'public, s-maxage=1800, stale-while-revalidate=86400',
  newer: 'public, s-maxage=300',
}

/**
 * The adjacent date for a valid query, or `undefined` when the zone isn't one of the center's.
 * Throws when the archive can't be read, which the caller must not mistake for "none".
 */
async function searchAdjacent(
  center: string,
  query: AdjacentQuery,
): Promise<string | null | undefined> {
  const [zone, metadata] = await Promise.all([
    resolveZoneFromSlug(center, query.zoneSlug),
    getAvalancheCenterMetadata(center),
  ])
  if (!zone) return undefined

  const calendarStart = forecastCalendarStart(metadata.widget_config.forecast?.start_year)

  return findAdjacentDate({
    date: query.date,
    direction: query.direction,
    bound: query.direction === 'older' ? calendarStart : latestValidDate(),
    fetchDates: async (window) => {
      const archive = await fetchProductArchiveOrThrow(center, window)
      return buildZoneArchiveDates(archive, zone.zone.id, metadata.timezone).map((d) => d.date)
    },
  })
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

  let adjacent: string | null | undefined
  try {
    adjacent = await searchAdjacent(center, query)
  } catch {
    // The picker keeps the arrow enabled and says so; a failure is never "no older forecast".
    return NextResponse.json({ error: 'Archive unavailable' }, { status: 502, headers: NO_STORE })
  }

  if (adjacent === undefined) {
    return NextResponse.json({ error: 'Zone not found' }, { status: 404, headers: NO_STORE })
  }

  return NextResponse.json(
    { date: adjacent },
    { headers: { 'Cache-Control': CACHE_CONTROL[query.direction] } },
  )
}
