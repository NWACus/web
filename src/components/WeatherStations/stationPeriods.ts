import { TZDate } from '@date-fns/tz'
import {
  addDays,
  addMinutes,
  differenceInCalendarDays,
  differenceInHours,
  format,
  isValid,
  parseISO,
  subHours,
  subMinutes,
} from 'date-fns'

export type StationPeriod = {
  key: string
  label: string
  hoursBack: (now: Date, timeZone: string) => number
}

// Hours back to the most recent Oct 1, the season anchor in the center's zone.
export function seasonHours(now: Date, timeZone: string): number {
  const local = new TZDate(now.getTime(), timeZone)
  const year = local.getMonth() >= 9 ? local.getFullYear() : local.getFullYear() - 1
  const seasonStart = new TZDate(year, 9, 1, timeZone)
  return Math.max(24, differenceInHours(now, seasonStart, { roundingMethod: 'ceil' }))
}

const WEEK_PERIOD: StationPeriod = { key: '7d', label: '7 days', hoursBack: () => 7 * 24 }

export const STATION_PERIODS: StationPeriod[] = [
  { key: '24h', label: '24 hours', hoursBack: () => 24 },
  { key: '48h', label: '48 hours', hoursBack: () => 48 },
  { key: '72h', label: '72 hours', hoursBack: () => 72 },
  WEEK_PERIOD,
  { key: '30d', label: '30 days', hoursBack: () => 30 * 24 },
  { key: '3m', label: '3 months', hoursBack: () => 91 * 24 },
  { key: '6m', label: '6 months', hoursBack: () => 182 * 24 },
  { key: 'season', label: 'Season', hoursBack: seasonHours },
]

export const GRAPH_PERIODS = STATION_PERIODS

export const DEFAULT_GRAPH_PERIOD = WEEK_PERIOD

// Tables cap at 30 days: longer graph periods aggregate to daily rows, which
// a row-per-observation table can't do.
export const TABLE_PERIODS = STATION_PERIODS.filter((p) => ['24h', '7d', '30d'].includes(p.key))

// Legacy `?range=24h`/`?range=7d` URLs resolve as period keys.
export function resolveTablePeriod(param: string | undefined): StationPeriod {
  return TABLE_PERIODS.find((p) => p.key === param) ?? TABLE_PERIODS[0]
}

/** A custom range of whole days in the center's zone, both ends inclusive (`yyyy-MM-dd`). */
export type DateRange = { from: string; to: string }

// A safety bound, not a UX one: tables render every observation server-side.
export const TABLE_MAX_CUSTOM_DAYS = 92
// Five years including a leap day; graph-data enforces the same window.
export const GRAPH_MAX_CUSTOM_DAYS = 5 * 365 + 1
// NWAC's own loggers report to SnowObs from mid-2015.
export const EARLIEST_CUSTOM_DATE = '2015-10-01'

// A whole-string yyyy-MM-dd date, the only form a custom range takes in the URL.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isIsoDate(value: string | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false
  const parsed = parseISO(value)
  // Rejects dates like 2026-02-31 that parseISO rolls over.
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value
}

export function todayInZone(now: Date, timeZone: string): string {
  return format(new TZDate(now.getTime(), timeZone), 'yyyy-MM-dd')
}

/** Inclusive day count of a range. */
export function rangeDays(range: DateRange): number {
  return differenceInCalendarDays(parseISO(range.to), parseISO(range.from)) + 1
}

// Anything that isn't a valid, ordered, past range within `maxDays` is null,
// so the caller falls back to its default period.
export function parseCustomRange(
  from: string | undefined,
  to: string | undefined,
  maxDays: number,
  timeZone: string,
  now: Date,
): DateRange | null {
  if (!isIsoDate(from) || !isIsoDate(to)) return null
  const range = { from, to }
  if (from > to || to > todayInZone(now, timeZone)) return null
  return rangeDays(range) > maxDays ? null : range
}

// A plain Date, so its ISO string is UTC like the presets' and graph-data URLs share a cache key.
function startOfDayInZone(date: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(new TZDate(year, month - 1, day, timeZone).getTime())
}

/** The instants a range covers: midnight of `from` to 23:59 of `to`, or now when `to` is today. */
export function customRangeBounds(
  range: DateRange,
  timeZone: string,
  now: Date,
): { from: Date; to: Date | null } {
  const from = startOfDayInZone(range.from, timeZone)
  if (range.to >= todayInZone(now, timeZone)) return { from, to: null }
  // SnowObs's end_date is inclusive, so stop a minute short of the next midnight's reading.
  const dayAfter = format(addDays(parseISO(range.to), 1), 'yyyy-MM-dd')
  return { from, to: subMinutes(startOfDayInZone(dayAfter, timeZone), 1) }
}

export function formatRangeLabel(range: DateRange, now: Date, timeZone: string): string {
  const thisYear = todayInZone(now, timeZone).slice(0, 4)
  const showYear = range.from.slice(0, 4) !== thisYear || range.to.slice(0, 4) !== thisYear
  const pattern = showYear ? 'MMM d, yyyy' : 'MMM d'
  const from = format(parseISO(range.from), pattern)
  return range.from === range.to ? from : `${from} – ${format(parseISO(range.to), pattern)}`
}

/** The calendar days a rolling preset touches, for labelling it like a custom range. */
export function presetRange(period: StationPeriod, timeZone: string, now: Date): DateRange {
  // hoursBack rounds up to whole hours (Season starts up to 59 minutes before Oct 1), so the
  // label steps forward to the day the readings start.
  const start = addMinutes(subHours(now, period.hoursBack(now, timeZone)), 59)
  return { from: todayInZone(start, timeZone), to: todayInZone(now, timeZone) }
}
