import { seasonOfDate, seasonWindow } from '@/services/nac/forecastArchive'
import { TZDate } from '@date-fns/tz'

export const RANGE_PRESETS = ['7d', '30d', '90d', 'seasonToDate', 'lastSeason'] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]
export const DEFAULT_PRESET: RangePreset = '30d'

const PRESET_DAYS = { '7d': 7, '30d': 30, '90d': 90 } as const

/**
 * What the stats row compares against: the same number of days just before the range, or the same
 * dates a year earlier. Seasons use the year-earlier baseline, so September–November is compared
 * with last September–November rather than the summer before it.
 */
export const BASELINES = ['preceding', 'yearEarlier'] as const
export type Baseline = (typeof BASELINES)[number]

export function isBaseline(value: unknown): value is Baseline {
  return typeof value === 'string' && BASELINES.some((baseline) => baseline === value)
}

export function presetBaseline(preset: RangePreset | 'custom'): Baseline {
  return preset === 'seasonToDate' || preset === 'lastSeason' ? 'yearEarlier' : 'preceding'
}

/**
 * An events scan costs PostHog about 1.5 seconds per 10 days of calendar range, so a year is the
 * ceiling before a cold load takes minutes; see docs/admin-analytics.md.
 */
export const MAX_RANGE_DAYS = 366

/** Inclusive calendar dates, `YYYY-MM-DD`, in the center's timezone. */
export type DateRange = { from: string; to: string }

export type ResolvedRange = {
  from: string
  to: string
  previousFrom: string
  previousTo: string
  baseline: Baseline
  /** Instants bounding the periods: [previousStart, previousEnd) and [start, end). */
  previousStart: Date
  previousEnd: Date
  start: Date
  end: Date
  timezone: string
  /** The trend's grouping: the caller's choice, or `defaultInterval` for the range. */
  bucket: TrendInterval
  /** The range runs to now, so its last day is still collecting events. */
  ongoing: boolean
}

export const TREND_INTERVALS = ['day', 'week', 'month'] as const
export type TrendInterval = (typeof TREND_INTERVALS)[number]

export function isTrendInterval(value: unknown): value is TrendInterval {
  return typeof value === 'string' && TREND_INTERVALS.some((interval) => interval === value)
}

/** The groupings that draw a useful line for a range of `days`: weeks past two, months past 92 days. */
export function trendIntervals(days: number): TrendInterval[] {
  if (days > 92) return ['day', 'week', 'month']
  if (days > 14) return ['day', 'week']
  return ['day']
}

/** Days up to 92 days; longer ranges use weeks so the chart stays readable. */
export function defaultInterval(days: number): TrendInterval {
  return days > 92 ? 'week' : 'day'
}

/** The requested grouping if the range allows it, else the range's default when none was asked for. */
function resolveInterval(
  requested: string | null | undefined,
  days: number,
): TrendInterval | { error: string } {
  if (requested == null) return defaultInterval(days)
  if (!isTrendInterval(requested)) return { error: 'Unknown interval' }
  return trendIntervals(days).includes(requested)
    ? requested
    : { error: `This range can't be grouped by ${requested}` }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))
}

export function isRangePreset(value: unknown): value is RangePreset {
  return typeof value === 'string' && RANGE_PRESETS.some((preset) => preset === value)
}

const pad = (n: number) => String(n).padStart(2, '0')

export function formatIsoDate(date: TZDate): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Midnight at the start of `isoDate` in `timezone`. */
export function zonedDayStart(isoDate: string, timezone: string): TZDate {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new TZDate(year, month - 1, day, timezone)
}

function addDays(date: TZDate, days: number): TZDate {
  const next = new TZDate(date, date.timeZone)
  next.setDate(next.getDate() + days)
  return next
}

export function todayIn(timezone: string, now: Date): string {
  return formatIsoDate(new TZDate(now, timezone))
}

/**
 * A day-count preset starts `days` before today, so 7 days covers today plus the seven before it.
 * Seasons run September 1 to August 31, the same seasons as the forecast archive and weather pickers.
 */
export function presetRange(preset: RangePreset, timezone: string, now: Date): DateRange {
  const today = todayIn(timezone, now)
  if (preset === 'seasonToDate') return { from: seasonWindow(seasonOfDate(today)).from, to: today }
  if (preset === 'lastSeason') return seasonWindow(seasonOfDate(today) - 1)
  const from = addDays(zonedDayStart(today, timezone), -PRESET_DAYS[preset])
  return { from: formatIsoDate(from), to: today }
}

/**
 * Rounds up to the next hour so the SQL text is identical within the hour and PostHog's own
 * query cache can answer repeats.
 */
function ceilToHour(date: Date): Date {
  const rounded = new Date(date)
  rounded.setUTCMinutes(0, 0, 0)
  if (rounded.getTime() < date.getTime()) rounded.setUTCHours(rounded.getUTCHours() + 1)
  return rounded
}

/** Inclusive day count of a calendar range; NaN for malformed dates. */
export function rangeDays(range: DateRange): number {
  return Math.round((Date.parse(range.to) - Date.parse(range.from)) / 86_400_000) + 1
}

/** The same calendar day a year earlier; February 29 falls back to February 28. */
function yearEarlier(isoDate: string): string {
  const year = Number(isoDate.slice(0, 4)) - 1
  const monthDay = isoDate.slice(5)
  return `${year}-${monthDay === '02-29' ? '02-28' : monthDay}`
}

type PreviousPeriod = Pick<
  ResolvedRange,
  'previousFrom' | 'previousTo' | 'previousStart' | 'previousEnd'
>

function previousPeriod(
  range: DateRange,
  days: number,
  baseline: Baseline,
  timezone: string,
): PreviousPeriod {
  const start = zonedDayStart(range.from, timezone)
  const previous =
    baseline === 'yearEarlier'
      ? { from: yearEarlier(range.from), to: yearEarlier(range.to) }
      : {
          from: formatIsoDate(addDays(start, -days)),
          to: formatIsoDate(addDays(start, -1)),
        }
  return {
    previousFrom: previous.from,
    previousTo: previous.to,
    previousStart: new Date(zonedDayStart(previous.from, timezone).getTime()),
    previousEnd: new Date(addDays(zonedDayStart(previous.to, timezone), 1).getTime()),
  }
}

export function resolveRange(
  range: DateRange,
  timezone: string,
  now: Date,
  interval?: string | null,
  requestedBaseline?: string | null,
): ResolvedRange | { error: string } {
  const baseline = requestedBaseline ?? 'preceding'
  if (!isIsoDate(range.from) || !isIsoDate(range.to)) return { error: 'Dates must be YYYY-MM-DD' }
  if (range.from > range.to) return { error: 'The start date must not be after the end date' }

  const start = zonedDayStart(range.from, timezone)
  const dayAfterTo = addDays(zonedDayStart(range.to, timezone), 1)
  const days = Math.round((dayAfterTo.getTime() - start.getTime()) / 86_400_000)
  if (days > MAX_RANGE_DAYS) return { error: `Ranges are limited to ${MAX_RANGE_DAYS} days` }
  const bucket = resolveInterval(interval, days)
  if (typeof bucket === 'object') return bucket
  if (!isBaseline(baseline)) return { error: 'Unknown comparison baseline' }

  const end = new Date(Math.min(dayAfterTo.getTime(), ceilToHour(now).getTime()))

  return {
    from: range.from,
    to: range.to,
    ...previousPeriod(range, days, baseline, timezone),
    baseline,
    start: new Date(start.getTime()),
    end,
    timezone,
    bucket,
    ongoing: end.getTime() < dayAfterTo.getTime(),
  }
}
