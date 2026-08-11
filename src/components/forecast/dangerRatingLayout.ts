/**
 * Pure decisions behind the avalanche danger section: what heads each day column, and whether
 * today's ratings are blank enough to warrant the legacy "no rating" advice.
 *
 * The full dated view passes a published time and gets real valid dates; the compact all-zones
 * card passes none and falls back to "Today"/"Tomorrow".
 */
import { validDateHeading } from '@/services/nac/archiveDates'
import { type AvalancheDangerForecast, DangerLevel } from '@/services/nac/model/forecast'

export interface DangerHeadings {
  /** True when the caller supplied a published time, i.e. this is the full dated view. */
  dated: boolean
  today: string
  tomorrow: string
}

export function dangerHeadings(
  publishedTime: string | undefined,
  timezone: string | null | undefined,
): DangerHeadings {
  if (publishedTime == null) return { dated: false, today: 'Today', tomorrow: 'Tomorrow' }

  return {
    dated: true,
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
