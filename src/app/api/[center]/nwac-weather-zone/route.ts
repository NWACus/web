// The same false positive the sibling `api/[center]` routes waive; see `forecast-archive`.
// fallow-ignore-file dynamic-segment-name-conflicts
import { sanitizeIssuance } from '@/components/NWACWeather/sanitizeIssuance'
import { publishedDateForProduct } from '@/services/nac/archiveDates'
import { todayInTimezone } from '@/services/nac/forecastArchive'
import type { NWACWeatherForecastDay } from '@/services/nac/model/nwacWeather'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { zonesFor } from '@/services/nac/nwacWeatherFormat'
import { getNWACWeatherSource } from '@/services/nac/sources'
import { NO_STORE, unknownCenterResponse } from '@/utilities/apiResponses'
import { format, parseISO, subDays } from 'date-fns'
import { NextRequest, NextResponse } from 'next/server'

/**
 * The issuance a widget forecast was written against: the newest covering the zone published before
 * it, within a day, as nwac.us chose it (`{ day: null }` when none), its HTML sanitized.
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

  // An issuance up to a day before the forecast sits on its publish date or the one before.
  const today = todayInTimezone(timezone)
  const dates = [asked.date, format(subDays(parseISO(asked.date), 1), 'yyyy-MM-dd')]
  const days = await Promise.all(
    dates.map((date) => getNWACWeatherSource().getDay(date, { historical: date < today })),
  )
  const zoneDay = newestBefore(days, asked.zone, asked.published)
  const historical = asked.date < today

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
const DAY_MS = 24 * 60 * 60 * 1000

/** The avalanche zone id, the forecast's publish instant and its local publish date, or null. */
function parseQuery(query: URLSearchParams, timezone: string | null | undefined) {
  const zone = Number(query.get('zone'))
  const iso = query.get('published') ?? ''
  const date = publishedDateForProduct(iso, timezone)
  return Number.isInteger(zone) && zone > 0 && date
    ? { zone, published: new Date(iso).getTime(), date }
    : null
}

/**
 * The newest issuance covering the zone published before `published` and within a day of it, as a
 * one-issuance day with its authored HTML sanitized; null when there is none.
 */
function newestBefore(
  days: (NWACWeatherForecastDay | null)[],
  zone: number,
  published: number,
): NWACWeatherForecastDay | null {
  const candidates = days.flatMap((day) =>
    (day?.issuances ?? []).flatMap((issuance) => {
      const issued = new Date(issuance.issuedAt).getTime()
      const fits =
        day !== null &&
        issued <= published &&
        issued > published - DAY_MS &&
        zonesFor(issuance, zone).length > 0
      return fits ? [{ day, issuance, issued }] : []
    }),
  )
  const newest = candidates.sort((a, b) => b.issued - a.issued)[0]
  return newest ? { ...newest.day, issuances: [sanitizeIssuance(newest.issuance)] } : null
}
