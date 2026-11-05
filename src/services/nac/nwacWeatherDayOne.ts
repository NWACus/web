/**
 * Which of an issuance's periods sit beside an avalanche forecast: its Day 1 only. A forecast
 * published the afternoon before runs through the night and that day; from midnight only the day
 * is left. Kept free of network and React so each time of day is unit-testable.
 */
import { format, parseISO, subDays } from 'date-fns'

import type { NWACWeatherIssuance } from './model/nwacWeather'

export interface NWACWeatherDayOne {
  /** The key of the 12h period for the forecast's valid date. */
  day: string
  /** The key of the night before it, when the forecast runs through that night. */
  night: string | null
  /** `YYYY-MM-DD` the night drops off at midnight; null when what was published stays as it was. */
  rollsOn: string | null
}

/**
 * The forecast's Day 1 in `issuance`, or null when the issuance doesn't forecast that day. A
 * `live` forecast rolls forward at midnight on its valid date; any other stays as it read when
 * `publishedDate` came, so one published on its valid date never had a night.
 */
export function dayOneOf(
  issuance: NWACWeatherIssuance,
  { validDate, publishedDate, live }: { validDate: string; publishedDate: string; live: boolean },
): NWACWeatherDayOne | null {
  const day = issuance.periods.find((p) => p.kind === 'day' && p.date === validDate)
  if (!day) return null
  const nightDate = format(subDays(parseISO(validDate), 1), 'yyyy-MM-dd')
  const night = issuance.periods.find((p) => p.kind === 'night' && p.date === nightDate)
  const hadNight = live || publishedDate < validDate
  return {
    day: day.key,
    night: night && hadNight ? night.key : null,
    rollsOn: live ? validDate : null,
  }
}

/** Whether the night has dropped off by `today`, the center's local `YYYY-MM-DD`. */
export function hasRolledOver(dayOne: NWACWeatherDayOne, today: string): boolean {
  return dayOne.rollsOn !== null && today >= dayOne.rollsOn
}

/** The period keys to show on `today`, in time order. */
export function dayOnePeriodKeys(dayOne: NWACWeatherDayOne, today: string): string[] {
  return dayOne.night && !hasRolledOver(dayOne, today) ? [dayOne.night, dayOne.day] : [dayOne.day]
}
