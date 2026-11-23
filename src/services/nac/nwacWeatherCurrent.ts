import { format, parseISO, subDays } from 'date-fns'

import type { NWACWeatherForecastDay } from './model/nwacWeather'

/**
 * The forecast today's Mountain Weather page shows: the latest one, as long as it is today's or
 * yesterday's. Yesterday afternoon's covers tonight and tomorrow, so it stands in until the morning
 * issuance; anything older (an off-season leftover) is not current, and the page says so.
 */
export function currentNWACWeatherDay(
  latest: NWACWeatherForecastDay | null,
  today: string,
): NWACWeatherForecastDay | null {
  if (!latest) return null
  const yesterday = format(subDays(parseISO(today), 1), 'yyyy-MM-dd')
  return latest.serviceDate >= yesterday ? latest : null
}

/**
 * Whether a dated Mountain Weather page shows a past forecast: one before the current forecast's
 * date, which until the morning issuance is yesterday's.
 */
export function isPastNWACWeatherDate(
  date: string,
  latest: NWACWeatherForecastDay | null,
  today: string,
): boolean {
  if (date >= today) return false
  return date < (currentNWACWeatherDay(latest, today)?.serviceDate ?? today)
}
