// The same false positive the sibling `api/[center]` routes waive; see `forecast-archive`.
// fallow-ignore-file dynamic-segment-name-conflicts
import { sanitizeIssuance } from '@/components/NWACWeather/sanitizeIssuance'
import { validDateForProduct } from '@/services/nac/archiveDates'
import { todayInTimezone } from '@/services/nac/forecastArchive'
import type { NWACWeatherForecastDay } from '@/services/nac/model/nwacWeather'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { zonesFor } from '@/services/nac/nwacWeatherFormat'
import { getNWACWeatherSource } from '@/services/nac/sources'
import { NO_STORE, unknownCenterResponse } from '@/utilities/apiResponses'
import { NextRequest, NextResponse } from 'next/server'

/**
 * The Mountain Weather the legacy forecast widget shows under a zone's forecast, the AvyWeb
 * counterpart of nwac.us's `/weather-forecast-summary/`. The widget announces each forecast it
 * renders with a `nac-loaded` event (zone id + published time); WidgetZoneWeather asks here for the
 * day that forecast is valid for, narrowed to the issuances that cover the zone. The synopsis and
 * outlook are sanitized here, since the section renders in the browser. `{ day: null }` when
 * there is nothing for the zone that day.
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

  const historical = asked.date < todayInTimezone(timezone)
  const day = await getNWACWeatherSource().getDay(asked.date, { historical })

  return NextResponse.json(
    { day: day && forZone(day, asked.zone) },
    // A past day no longer changes; the current one can gain its afternoon issuance.
    { headers: { 'Cache-Control': historical ? HISTORICAL_CACHE : CURRENT_CACHE } },
  )
}

const CURRENT_CACHE = 'public, s-maxage=300, stale-while-revalidate=600'
const HISTORICAL_CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800'

/** The avalanche zone id and the date its forecast is valid for, or null when either is bad. */
function parseQuery(query: URLSearchParams, timezone: string | null | undefined) {
  const zone = Number(query.get('zone'))
  const date = validDateForProduct(query.get('published') ?? '', timezone)
  return Number.isInteger(zone) && zone > 0 && date ? { zone, date } : null
}

/** The day's issuances that cover the zone, with their authored HTML sanitized; null when none. */
function forZone(day: NWACWeatherForecastDay, zone: number): NWACWeatherForecastDay | null {
  const issuances = day.issuances.filter((i) => zonesFor(i, zone).length > 0).map(sanitizeIssuance)
  return issuances.length ? { ...day, issuances } : null
}
