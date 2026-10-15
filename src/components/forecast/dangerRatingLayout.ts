/**
 * Pure decisions behind the avalanche danger section: what heads each day column, and whether
 * today's ratings are blank enough to warrant the legacy "no rating" advice.
 */
import { validDateHeading } from '@/services/nac/archiveDates'
import { type AvalancheDangerForecast, DangerLevel } from '@/services/nac/model/forecast'

export interface DangerHeadings {
  today: string
  tomorrow: string
}

/** Each day column's valid date, or "Today"/"Tomorrow" when the published time won't parse. */
export function dangerHeadings(
  publishedTime: string,
  timezone: string | null | undefined,
): DangerHeadings {
  return {
    today: validDateHeading(publishedTime, timezone, 0) ?? 'Today',
    tomorrow: validDateHeading(publishedTime, timezone, 1) ?? 'Tomorrow',
  }
}

/** True when every elevation band is unrated — the legacy widget then points readers at the summary. */
export function isNoRatingDay(forecast: AvalancheDangerForecast | undefined): boolean {
  if (forecast == null) return false

  return (
    forecast.upper === DangerLevel.None &&
    forecast.middle === DangerLevel.None &&
    forecast.lower === DangerLevel.None
  )
}
