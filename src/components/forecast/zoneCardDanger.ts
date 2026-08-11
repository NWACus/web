/**
 * The danger level the all-zones card tints its bottom line with: the highest of today's three
 * elevation bands. A summary product carries no danger ratings, so it tints as unrated.
 */
import {
  DangerLevel,
  ForecastPeriod,
  ProductType,
  type ForecastResult,
} from '@/services/nac/model/forecast'

/** All danger levels ordered for safe index lookup. */
const dangerLevels: DangerLevel[] = [
  DangerLevel.None,
  DangerLevel.Low,
  DangerLevel.Moderate,
  DangerLevel.Considerable,
  DangerLevel.High,
  DangerLevel.Extreme,
]

export function highestDangerLevel(danger: {
  upper: DangerLevel
  middle: DangerLevel
  lower: DangerLevel
}): DangerLevel {
  const max = Math.max(danger.upper, danger.middle, danger.lower)
  return dangerLevels[max] ?? DangerLevel.None
}

/** The level to tint the card's bottom line with, or `None` when there is nothing to go on. */
export function bottomLineDangerLevel(forecast: ForecastResult | null): DangerLevel {
  if (forecast?.product_type !== ProductType.Forecast) return DangerLevel.None

  const today = forecast.danger.find((d) => d.valid_day === ForecastPeriod.Current)
  if (!today) return DangerLevel.None

  return highestDangerLevel(today)
}
