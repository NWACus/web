// The same false positive the sibling `api/[center]` routes waive; see `forecast-archive`.
// fallow-ignore-file dynamic-segment-name-conflicts
import { publishedDateForProduct } from '@/services/nac/archiveDates'
import { todayInTimezone } from '@/services/nac/forecastArchive'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { getNWACWeatherForForecast } from '@/services/nac/nwacWeatherForForecast'
import { NO_STORE, unknownCenterResponse } from '@/utilities/apiResponses'
import { NextRequest, NextResponse } from 'next/server'

/**
 * The issuance a widget forecast was written against (`getNWACWeatherForForecast`, as the native
 * pages choose it): `{ day: null }` when none.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  if ((await params).center !== 'nwac') return unknownCenterResponse()

  const { timezone } = await getAvalancheCenterMetadata('nwac')
  const asked = parseQuery(request.nextUrl.searchParams, timezone)
  if (!asked) {
    return NextResponse.json(
      { error: 'Invalid zone/published parameters' },
      { status: 400, headers: NO_STORE },
    )
  }

  const zoneDay = await getNWACWeatherForForecast('nwac', asked.zone, asked.published, timezone)
  const historical = asked.date < todayInTimezone(timezone)

  return NextResponse.json(
    { day: zoneDay },
    // A forecast from a past day has every issuance before it already published. Nothing found
    // is kept briefly either way: an issuance published late, or an upstream hiccup, would
    // otherwise hide a past day for a day.
    {
      headers: {
        'Cache-Control': historical && zoneDay ? HISTORICAL_CACHE : CURRENT_CACHE,
      },
    },
  )
}

const CURRENT_CACHE = 'public, s-maxage=300, stale-while-revalidate=600'
const HISTORICAL_CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800'

/** The avalanche zone id, the forecast's publish time and its local publish date, or null. */
function parseQuery(query: URLSearchParams, timezone: string | null | undefined) {
  const zone = Number(query.get('zone'))
  const published = query.get('published') ?? ''
  const date = publishedDateForProduct(published, timezone)
  return Number.isInteger(zone) && zone > 0 && date ? { zone, published, date } : null
}
