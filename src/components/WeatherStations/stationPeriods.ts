import { seasonOfDate } from '@/services/nac/forecastArchive'
import { TZDate } from '@date-fns/tz'
import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  subDays,
  subHours,
  subMinutes,
} from 'date-fns'

export type StationPeriod = {
  key: string
  label: string
  hours: number
}

const WEEK_PERIOD: StationPeriod = { key: '7d', label: '7 days', hours: 7 * 24 }

export const STATION_PERIODS: StationPeriod[] = [
  { key: '24h', label: '24 hours', hours: 24 },
  { key: '48h', label: '48 hours', hours: 48 },
  { key: '72h', label: '72 hours', hours: 72 },
  WEEK_PERIOD,
  { key: '30d', label: '30 days', hours: 30 * 24 },
]

// One list today, kept apart so the tabs can offer different ranges later.
export const GRAPH_PERIODS = STATION_PERIODS
export const TABLE_PERIODS = STATION_PERIODS

export const DEFAULT_GRAPH_PERIOD = WEEK_PERIOD

// Legacy `?range=24h`/`?range=7d` URLs resolve as period keys; retired keys get the default.
export function resolveTablePeriod(param: string | undefined): StationPeriod {
  return TABLE_PERIODS.find((p) => p.key === param) ?? TABLE_PERIODS[0]
}

/** A custom range of whole days in the center's zone, both ends inclusive (`yyyy-MM-dd`). */
export type DateRange = { from: string; to: string }

// A season at most, leap day included. Kept apart so the tabs can have different limits later.
export const TABLE_MAX_CUSTOM_DAYS = 366
export const GRAPH_MAX_CUSTOM_DAYS = 366
// The Table tab renders this many days at a time; older ones load as the reader scrolls.
export const TABLE_CHUNK_DAYS = 30

/** The seasons a station page offers: the current one and the one before, newest first. */
export function stationSeasons(today: string): number[] {
  const current = seasonOfDate(today)
  return [current, current - 1]
}

// A whole-string yyyy-MM-dd date, the only form a custom range takes in the URL.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isIsoDate(value: string | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false
  const parsed = parseISO(value)
  // Rejects dates like 2026-02-31 that parseISO rolls over.
  return isValid(parsed) && toIsoDate(parsed) === value
}

/** A date's calendar day as `yyyy-MM-dd`, read in the zone the Date carries. */
export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isPastRange(custom: DateRange | null, timeZone: string): boolean {
  return custom !== null && custom.to < todayInZone(new Date(), timeZone)
}

export function todayInZone(now: Date, timeZone: string): string {
  return toIsoDate(new TZDate(now.getTime(), timeZone))
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
  const today = todayInZone(now, timeZone)
  if (from > to || to > today) return null
  const inOneOfferedSeason =
    seasonOfDate(from) === seasonOfDate(to) && stationSeasons(today).includes(seasonOfDate(from))
  return inOneOfferedSeason && rangeDays(range) <= maxDays ? range : null
}

/**
 * The newest days of a range ending before `before` (or the whole range's end), and the `before`
 * that asks for the next older chunk, null once the range is covered.
 */
export function tableChunk(
  range: DateRange,
  before: string | null,
): { chunk: DateRange; next: string | null } {
  const end = before ? subDays(parseISO(before), 1) : parseISO(range.to)
  const earliest = toIsoDate(subDays(end, TABLE_CHUNK_DAYS - 1))
  const from = earliest > range.from ? earliest : range.from
  return { chunk: { from, to: toIsoDate(end) }, next: from > range.from ? from : null }
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
  const dayAfter = toIsoDate(addDays(parseISO(range.to), 1))
  return { from, to: subMinutes(startOfDayInZone(dayAfter, timeZone), 1) }
}

/** "Sep 6 – Sep 7, 2025", naming the first year too when the range crosses into another. */
export function formatRangeLabel(range: DateRange): string {
  const from = parseISO(range.from)
  const to = format(parseISO(range.to), 'MMM d, yyyy')
  if (range.from === range.to) return to
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4)
  return `${format(from, sameYear ? 'MMM d' : 'MMM d, yyyy')} – ${to}`
}

/** The calendar days a rolling preset touches, for labelling it like a custom range. */
export function presetRange(period: StationPeriod, timeZone: string, now: Date): DateRange {
  const start = subHours(now, period.hours)
  return { from: todayInZone(start, timeZone), to: todayInZone(now, timeZone) }
}
