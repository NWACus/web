/**
 * The all-zones card's danger decisions: the level it tints its bottom line with (the highest of
 * today's three elevation bands; a summary carries no ratings, so it tints as unrated), and which
 * days its danger section shows.
 */
import {
  DangerLevel,
  ForecastPeriod,
  ProductType,
  type AvalancheDangerForecast,
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

/**
 * The days the card shows: today without the outlook, as in the widget's all-zones view. Dropped by
 * `valid_day` rather than position, so an unordered or outlook-less list still keeps today.
 */
export function withoutOutlook(danger: AvalancheDangerForecast[]): AvalancheDangerForecast[] {
  return danger.filter((day) => day.valid_day !== ForecastPeriod.Tomorrow)
}
