/**
 * Where a forecast's mountain-weather product is found. One branch, in one place, so the live
 * forecast page and the dated history route cannot disagree about it.
 *
 * Nearly every forecast points at its weather through `weather_data.weather_product_id`. The
 * exception is SNFAC's forecasts published before 2020-05-01 (inventory row F26): they predate the
 * pointer, so the legacy widget located their weather by center, zone and date instead. That is
 * reproduced here rather than in a page, and only the archive can reach those forecasts.
 */
import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns/format'

import type { ForecastResult, Weather } from './model/forecast'
import { getWeatherSource } from './sources'

/** The only center whose archive holds pointerless forecasts. */
const POINTERLESS_WEATHER_CENTER = 'snfac'

/** Forecasts published before this day carry no `weather_product_id`. */
const POINTERLESS_WEATHER_CUTOFF = '2020-05-01'

/** The weather product a forecast points at, or `null` when it carries no pointer. */
function weatherPointer(forecast: Pick<ForecastResult, 'weather_data'>): number | null {
  return forecast.weather_data?.weather_product_id ?? null
}

/** The calendar day a product was published on, in the center's timezone, as `yyyy-MM-dd`. */
function publishedDateInTimezone(publishedTime: string, timezone: string | null | undefined) {
  const instant = new Date(publishedTime)
  if (Number.isNaN(instant.getTime())) return null

  const local = timezone ? new TZDate(instant.getTime(), timezone) : instant
  return format(local, 'yyyy-MM-dd')
}

/**
 * The published date to locate a pointerless forecast's weather by, or `null` when this forecast
 * is not one of those. Exported for its test; pages go through `getWeatherForForecast`.
 */
export function pointerlessWeatherDate(
  centerSlug: string,
  forecast: Pick<ForecastResult, 'weather_data' | 'published_time'>,
  timezone: string | null | undefined,
): string | null {
  if (weatherPointer(forecast) !== null) return null
  if (centerSlug.toLowerCase() !== POINTERLESS_WEATHER_CENTER) return null

  const date = publishedDateInTimezone(forecast.published_time, timezone)
  return date !== null && date < POINTERLESS_WEATHER_CUTOFF ? date : null
}

/**
 * The mountain-weather product a forecast should show beside it, or `null` when it has none: by
 * the id the forecast points at, or for the pointerless SNFAC archive, by the day it was published.
 */
export async function getWeatherForForecast(
  centerSlug: string,
  zoneId: number,
  forecast: ForecastResult,
  timezone: string | null | undefined,
): Promise<Weather | null> {
  const source = getWeatherSource(centerSlug)

  const weatherProductId = weatherPointer(forecast)
  if (weatherProductId !== null) return source.getWeather(weatherProductId)

  const date = pointerlessWeatherDate(centerSlug, forecast, timezone)
  if (date === null) return null

  return source.getWeatherForDate(centerSlug, zoneId, date)
}
