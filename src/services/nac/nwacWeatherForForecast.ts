/**
 * Which of NWAC's Mountain Weather issuances sits beside a forecast, and which of its periods. NWAC
 * authors its weather in products-api, so its forecasts carry no `weather_product_id` for
 * `getWeatherForForecast` to follow; nwac.us chose the issuance by time instead, and so does every
 * AvyWeb page that shows it beside a forecast: the native zone and dated pages, and the widget
 * page through `api/[center]/nwac-weather-zone`.
 *
 * A forecast still in force follows the clock: the 24 hours on show now and the next, each from
 * the newest issuance that forecasts them. Any other keeps the 24 hours it was issued for, from the
 * issuance it was written against.
 */
import { sanitizeIssuance } from '@/components/NWACWeather/sanitizeIssuance'
import { format, parseISO, subDays } from 'date-fns'

import { publishedDateForProduct, validDateForProduct } from './archiveDates'
import { todayInTimezone } from './forecastArchive'
import type {
  NWACWeatherForecastDay,
  NWACWeatherIssuance,
  NWACWeatherZoneDay,
} from './model/nwacWeather'
import { zonesFor } from './nwacWeatherFormat'
import {
  heldSpan,
  nextSpan,
  spanAt,
  spanPeriodKeys,
  type NWACWeatherSpan,
  type NWACWeatherWindow,
} from './nwacWeatherWindow'
import { getNWACWeatherSource } from './sources'

/** The one center whose weather is found this way. */
const NWAC_WEATHER_CENTER = 'nwac'

const DAY_MS = 24 * 60 * 60 * 1000

/** The spans to show, and which issuances can sit beside the forecast. */
interface Asked {
  zone: number
  published: number
  latest: number
  spans: NWACWeatherSpan[]
  /** The spans are what a past forecast keeps, not the reader's now. */
  held: boolean
}

/**
 * The issuances for the avalanche zone (its numeric id), their authored HTML sanitized, with the
 * 24-hour windows read from them. `archived` holds a forecast to what it was written against even
 * on its own valid date, for a page cached as it was first rendered. Null on any center but NWAC,
 * and when there is none. Throws when a day can't be read.
 */
export async function getNWACWeatherForForecast(
  centerSlug: string,
  avalancheZoneId: number,
  publishedTime: string,
  timezone: string | null | undefined,
  { archived = false }: { archived?: boolean } = {},
): Promise<NWACWeatherZoneDay | null> {
  if (centerSlug !== NWAC_WEATHER_CENTER) return null
  const publishedDate = publishedDateForProduct(publishedTime, timezone)
  const validDate = validDateForProduct(publishedTime, timezone)
  if (!publishedDate || !validDate) return null

  const today = todayInTimezone(timezone)
  const live = !archived && today <= validDate
  const published = new Date(publishedTime).getTime()
  const now = new Date()
  const current = live ? spanAt(now, timezone) : null
  const spans = current
    ? [current, nextSpan(current, timezone)]
    : [heldSpan({ validDate, publishedDate, published: new Date(published) }, timezone)]
  // An issuance up to a day before the forecast sits on its publish date or the one before; one
  // after it, only while the forecast is in force, on today's.
  const dates = [publishedDate, format(subDays(parseISO(publishedDate), 1), 'yyyy-MM-dd')]
  if (live && today > publishedDate) dates.push(today)
  // Any day failing throws: with one day missing, another's issuance can be the wrong one.
  const days = await Promise.all(
    dates.map((day) => getNWACWeatherSource().getDay(day, { historical: day < today })),
  )
  return newestFor(days, {
    zone: avalancheZoneId,
    published,
    latest: live ? Math.max(published, now.getTime()) : published,
    spans,
    held: !live,
  })
}

function newestFor(
  days: (NWACWeatherForecastDay | null)[],
  { zone, published, latest, spans, held }: Asked,
): NWACWeatherZoneDay | null {
  const candidates = days
    .flatMap((day) =>
      (day?.issuances ?? []).flatMap((issuance) => {
        const issued = new Date(issuance.issuedAt).getTime()
        const fits =
          day !== null &&
          issued <= latest &&
          issued > published - DAY_MS &&
          zonesFor(issuance, zone).length > 0
        return fits ? [{ day, issuance, issued }] : []
      }),
    )
    .sort((a, b) => b.issued - a.issued)

  const chosen: { day: NWACWeatherForecastDay; issuance: NWACWeatherIssuance }[] = []
  const windows: NWACWeatherWindow[] = []
  for (const span of spans) {
    for (const candidate of candidates) {
      const periodKeys = spanPeriodKeys(candidate.issuance, span)
      if (!periodKeys) continue
      let index = chosen.findIndex((c) => c.issuance === candidate.issuance)
      if (index < 0) index = chosen.push(candidate) - 1
      windows.push({
        startsAt: span.startsAt.toISOString(),
        issuance: index,
        periodKeys,
        ...(held && { held }),
      })
      break
    }
  }
  if (chosen.length === 0) return null
  return {
    serviceDate: chosen[0].day.serviceDate,
    issuances: chosen.map((c) => sanitizeIssuance(c.issuance)),
    windows,
  }
}
