/**
 * Which 24 hours of NWAC's weather sit beside an avalanche forecast. The blocks roll over at fixed
 * times in the center's timezone: from 6 am the day and the night after it, from 6 pm the night and
 * the next day. Kept free of network and React so each time of day is unit-testable.
 */
import { TZDate } from '@date-fns/tz'
import { addDays, format, parseISO, subDays } from 'date-fns'

import type { NWACWeatherIssuance } from './model/nwacWeather'

const DAY_STARTS = 6
const NIGHT_STARTS = 18

export interface NWACWeatherHalfDay {
  kind: 'day' | 'night'
  /** `YYYY-MM-DD`; a night is dated by the evening it starts. */
  date: string
}

export interface NWACWeatherSpan {
  /** Two 12h periods in time order. */
  halves: [NWACWeatherHalfDay, NWACWeatherHalfDay]
  /** When this span starts showing. */
  startsAt: Date
  /** When the next one does. */
  endsAt: Date
}

/** One span as the page shows it, with the issuance it's read from. */
export interface NWACWeatherWindow {
  /** ISO; the page shows the last window started by the reader's clock, else the first. */
  startsAt: string
  /** Index into the zone day's issuances. */
  issuance: number
  periodKeys: string[]
}

const shiftDate = (date: string, days: number) =>
  format(addDays(parseISO(date), days), 'yyyy-MM-dd')

function localTime(date: string, hour: number, timezone: string | null | undefined): Date {
  const [y, m, d] = date.split('-').map(Number)
  // A plain Date, so toISOString() reads UTC rather than the zone offset.
  return new Date(
    timezone ? new TZDate(y, m - 1, d, hour, timezone).getTime() : new Date(y, m - 1, d, hour),
  )
}

function daySpan(date: string, timezone: string | null | undefined): NWACWeatherSpan {
  return {
    halves: [
      { kind: 'day', date },
      { kind: 'night', date },
    ],
    startsAt: localTime(date, DAY_STARTS, timezone),
    endsAt: localTime(date, NIGHT_STARTS, timezone),
  }
}

function nightSpan(date: string, timezone: string | null | undefined): NWACWeatherSpan {
  const next = shiftDate(date, 1)
  return {
    halves: [
      { kind: 'night', date },
      { kind: 'day', date: next },
    ],
    startsAt: localTime(date, NIGHT_STARTS, timezone),
    endsAt: localTime(next, DAY_STARTS, timezone),
  }
}

/** The span on show at `at`. */
export function spanAt(at: Date, timezone: string | null | undefined): NWACWeatherSpan {
  const local = timezone ? new TZDate(at.getTime(), timezone) : at
  const date = format(local, 'yyyy-MM-dd')
  const hour = local.getHours()
  if (hour < DAY_STARTS) return nightSpan(shiftDate(date, -1), timezone)
  if (hour < NIGHT_STARTS) return daySpan(date, timezone)
  return nightSpan(date, timezone)
}

/** The span after `span`. */
export function nextSpan(span: NWACWeatherSpan, timezone: string | null | undefined) {
  return spanAt(span.endsAt, timezone)
}

/**
 * The span a past forecast keeps: the night before its valid date and that day, as it was issued
 * the evening before; one published on its valid date keeps the span it was published in.
 */
export function heldSpan(
  {
    validDate,
    publishedDate,
    published,
  }: { validDate: string; publishedDate: string; published: Date },
  timezone: string | null | undefined,
): NWACWeatherSpan {
  if (publishedDate < validDate) {
    return nightSpan(format(subDays(parseISO(validDate), 1), 'yyyy-MM-dd'), timezone)
  }
  return spanAt(published, timezone)
}

/** The span's period keys in `issuance`, or null when it doesn't forecast both halves. */
export function spanPeriodKeys(issuance: NWACWeatherIssuance, span: NWACWeatherSpan) {
  const keys = span.halves.map(
    (half) => issuance.periods.find((p) => p.kind === half.kind && p.date === half.date)?.key,
  )
  return keys.every((k): k is string => k != null) ? keys : null
}

/** The window showing at `now`: the last one started, or the first when none has. */
export function windowShowing<W extends { startsAt: string }>(windows: W[], now: Date): W {
  const started = windows.filter((w) => new Date(w.startsAt).getTime() <= now.getTime())
  return started.at(-1) ?? windows[0]
}
