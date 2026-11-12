// The same false positive the sibling `api/[center]` routes waive; see `forecast-archive`.
// fallow-ignore-file dynamic-segment-name-conflicts
import { validDateForProduct } from '@/services/nac/archiveDates'
import { todayInTimezone } from '@/services/nac/forecastArchive'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { getNWACWeatherForForecast } from '@/services/nac/nwacWeatherForForecast'
import { NO_STORE, unknownCenterResponse } from '@/utilities/apiResponses'
import { NextRequest, NextResponse } from 'next/server'

/**
 * The issuance beside a widget forecast (`getNWACWeatherForForecast`, as the native pages choose
 * it): `{ day: null }` when none. Which 24 hours show turns on the reader's clock, in the page,
 * so no cached answer here can hold a window past its 6 am or 6 pm rollover.
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
  const historical = asked.validDate < todayInTimezone(timezone)

  return NextResponse.json(
    { day: zoneDay },
    // A forecast past its valid date keeps the issuance it was written against; one in force
    // picks up each new issuance. Nothing found is kept briefly either way: an issuance published
    // late, or an upstream hiccup, would otherwise hide a past day for a day.
    {
      headers: {
        'Cache-Control': historical && zoneDay ? HISTORICAL_CACHE : CURRENT_CACHE,
      },
    },
  )
}

const CURRENT_CACHE = 'public, s-maxage=300, stale-while-revalidate=600'
const HISTORICAL_CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800'

/** The avalanche zone id, the forecast's publish time and its valid date, or null. */
function parseQuery(query: URLSearchParams, timezone: string | null | undefined) {
  const zone = Number(query.get('zone'))
  const published = query.get('published') ?? ''
  const validDate = validDateForProduct(published, timezone)
  return Number.isInteger(zone) && zone > 0 && validDate ? { zone, published, validDate } : null
}
