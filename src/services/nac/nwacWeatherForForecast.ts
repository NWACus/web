/**
 * Which of NWAC's Mountain Weather issuances a forecast was written against. NWAC authors its
 * weather in products-api, so its forecasts carry no `weather_product_id` for
 * `getWeatherForForecast` to follow; nwac.us chose the issuance by time instead, and so does every
 * AvyWeb page that shows it beside a forecast: the native zone and dated pages, and the widget
 * page through `api/[center]/nwac-weather-zone`.
 */
import { sanitizeIssuance } from '@/components/NWACWeather/sanitizeIssuance'
import { format, parseISO, subDays } from 'date-fns'

import { publishedDateForProduct } from './archiveDates'
import { todayInTimezone } from './forecastArchive'
import type { NWACWeatherForecastDay } from './model/nwacWeather'
import { zonesFor } from './nwacWeatherFormat'
import { getNWACWeatherSource } from './sources'

/** The one center whose weather is found this way. */
const NWAC_WEATHER_CENTER = 'nwac'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The newest issuance covering the avalanche zone (its numeric id) published at or before the
 * forecast and within a day of it, as a one-issuance day with its authored HTML sanitized. Null
 * on any center but NWAC, and when there is none. Throws when either day can't be read.
 */
export async function getNWACWeatherForForecast(
  centerSlug: string,
  avalancheZoneId: number,
  publishedTime: string,
  timezone: string | null | undefined,
): Promise<NWACWeatherForecastDay | null> {
  if (centerSlug !== NWAC_WEATHER_CENTER) return null
  const date = publishedDateForProduct(publishedTime, timezone)
  if (!date) return null

  // An issuance up to a day before the forecast sits on its publish date or the one before.
  const today = todayInTimezone(timezone)
  const dates = [date, format(subDays(parseISO(date), 1), 'yyyy-MM-dd')]
  // Either day failing throws: with one day missing, the other's issuance can be the wrong one.
  const days = await Promise.all(
    dates.map((day) => getNWACWeatherSource().getDay(day, { historical: day < today })),
  )
  return newestBefore(days, avalancheZoneId, new Date(publishedTime).getTime())
}

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
