/**
 * Where a forecast's mountain-weather product is found. One branch, in one place, so the live
 * forecast page and the dated history route cannot disagree about it.
 *
 * Nearly every forecast points at its weather through `weather_data.weather_product_id`. The
 * exception is SNFAC's forecasts published before 2020-05-01 (inventory row F26): they predate the
 * pointer, so the legacy widget located their weather by center, zone and date instead. That is
 * reproduced here rather than in a page, and only the archive can reach those forecasts.
 */
import { publishedDateForProduct } from './archiveDates'
import type { ForecastResult, Weather } from './model/forecast'
import { isNwacWeatherEnabled } from './nac'
import { getNwacWeatherSource, getWeatherSource } from './sources'

/** The only center whose archive holds pointerless forecasts. */
const POINTERLESS_WEATHER_CENTER = 'snfac'

/** Forecasts published before this day carry no `weather_product_id`. */
const POINTERLESS_WEATHER_CUTOFF = '2020-05-01'

/** The weather product a forecast points at, or `null` when it carries no pointer. */
function weatherPointer(forecast: Pick<ForecastResult, 'weather_data'>): number | null {
  return forecast.weather_data?.weather_product_id ?? null
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

  const date = publishedDateForProduct(forecast.published_time, timezone)
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

/**
 * The weather a forecast page shows, from whichever source the center has: the AFP product found
 * above, else NWAC's in-house Mountain Weather Forecast, which no forecast points at. Its issuances
 * are found by date (`date`, or the latest date with content when omitted), narrowed to the zone;
 * a day none of whose issuances covers the zone counts as no NWAC weather.
 * Only a center with NWAC weather switched on makes that second call.
 */
export async function getWeatherSourcesForForecast(
  centerSlug: string,
  zoneId: number,
  forecast: ForecastResult,
  timezone: string | null | undefined,
  date?: string,
) {
  const weather = await getWeatherForForecast(centerSlug, zoneId, forecast, timezone)
  if (weather || !(await isNwacWeatherEnabled(centerSlug))) return { weather, nwacWeather: null }

  const day = await getNwacWeatherSource().getForecastDay({ date, zone: zoneId })
  // An issuance that doesn't cover this zone has nothing to show here; with none left there is no
  // weather section (or print option) at all rather than an empty one.
  const issuances = day?.issuances.filter((i) => i.zones.length > 0) ?? []
  return { weather, nwacWeather: day && issuances.length ? { ...day, issuances } : null }
}
