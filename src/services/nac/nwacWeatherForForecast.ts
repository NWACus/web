/**
 * Which of NWAC's Mountain Weather issuances sits beside a forecast, and which of its periods. NWAC
 * authors its weather in products-api, so its forecasts carry no `weather_product_id` for
 * `getWeatherForForecast` to follow; nwac.us chose the issuance by time instead, and so does every
 * AvyWeb page that shows it beside a forecast: the native zone and dated pages, and the widget
 * page through `api/[center]/nwac-weather-zone`.
 *
 * A forecast still in force takes the newest issuance that forecasts its Day 1, so a weather update
 * published after it shows. Any other shows the issuance it was written against.
 */
import { sanitizeIssuance } from '@/components/NWACWeather/sanitizeIssuance'
import { format, parseISO, subDays } from 'date-fns'

import { publishedDateForProduct, validDateForProduct } from './archiveDates'
import { todayInTimezone } from './forecastArchive'
import type { NWACWeatherForecastDay, NWACWeatherZoneDay } from './model/nwacWeather'
import { dayOneOf } from './nwacWeatherDayOne'
import { zonesFor } from './nwacWeatherFormat'
import { getNWACWeatherSource } from './sources'

/** The one center whose weather is found this way. */
const NWAC_WEATHER_CENTER = 'nwac'

const DAY_MS = 24 * 60 * 60 * 1000

/** The forecast's dates, and how late an issuance can be published to sit beside it. */
interface Asked {
  zone: number
  published: number
  latest: number
  validDate: string
  publishedDate: string
  live: boolean
}

/**
 * The issuance for the avalanche zone (its numeric id), as a one-issuance day with its authored
 * HTML sanitized and the periods of the forecast's Day 1. `archived` holds a forecast to what it
 * was written against even on its own valid date, for a page cached as it was first rendered. Null
 * on any center but NWAC, and when there is none. Throws when a day can't be read.
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
    latest: live ? Math.max(published, Date.now()) : published,
    validDate,
    publishedDate,
    live,
  })
}

function newestFor(
  days: (NWACWeatherForecastDay | null)[],
  { zone, published, latest, ...dates }: Asked,
): NWACWeatherZoneDay | null {
  const candidates = days.flatMap((day) =>
    (day?.issuances ?? []).flatMap((issuance) => {
      const issued = new Date(issuance.issuedAt).getTime()
      const dayOne = dayOneOf(issuance, dates)
      const fits =
        day !== null &&
        dayOne !== null &&
        issued <= latest &&
        issued > published - DAY_MS &&
        zonesFor(issuance, zone).length > 0
      return fits ? [{ day, dayOne, issuance, issued }] : []
    }),
  )
  const newest = candidates.sort((a, b) => b.issued - a.issued)[0]
  return newest
    ? { ...newest.day, issuances: [sanitizeIssuance(newest.issuance)], dayOne: newest.dayOne }
    : null
}
