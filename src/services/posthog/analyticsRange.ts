import { TZDate } from '@date-fns/tz'

export const RANGE_PRESETS = ['7d', '30d'] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]
export const DEFAULT_PRESET: RangePreset = '30d'

const PRESET_DAYS: Record<RangePreset, number> = { '7d': 7, '30d': 30 }

/**
 * PostHog stops API queries after 10 seconds of execution, and a scan of the events table costs
 * about 1.5 seconds per 10 days of calendar range whatever the filter matches. Two months is the
 * most that reliably fits; see docs/admin-analytics.md for the longer-range plan.
 */
export const MAX_RANGE_DAYS = 62

/** Inclusive calendar dates, `YYYY-MM-DD`, in the center's timezone. */
export type DateRange = { from: string; to: string }

export type ResolvedRange = {
  from: string
  to: string
  previousFrom: string
  previousTo: string
  /** Instants bounding the periods: [previousStart, start) and [start, end). */
  previousStart: Date
  start: Date
  end: Date
  timezone: string
  /** Day buckets up to 92 days; weeks beyond that, should the cap ever be lifted. */
  bucket: 'day' | 'week'
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

/** `from` is `days` before today, so a 7-day preset covers today plus the seven days before it. */
export function presetRange(preset: RangePreset, timezone: string, now: Date): DateRange {
  const today = zonedDayStart(todayIn(timezone, now), timezone)
  return { from: formatIsoDate(addDays(today, -PRESET_DAYS[preset])), to: formatIsoDate(today) }
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

export function resolveRange(
  range: DateRange,
  timezone: string,
  now: Date,
): ResolvedRange | { error: string } {
  if (!isIsoDate(range.from) || !isIsoDate(range.to)) return { error: 'Dates must be YYYY-MM-DD' }
  if (range.from > range.to) return { error: 'The start date must not be after the end date' }

  const start = zonedDayStart(range.from, timezone)
  const dayAfterTo = addDays(zonedDayStart(range.to, timezone), 1)
  const days = Math.round((dayAfterTo.getTime() - start.getTime()) / 86_400_000)
  if (days > MAX_RANGE_DAYS) return { error: `Ranges are limited to ${MAX_RANGE_DAYS} days` }

  const previousStart = addDays(start, -days)
  const previousEnd = addDays(start, -1)
  const end = new Date(Math.min(dayAfterTo.getTime(), ceilToHour(now).getTime()))

  return {
    from: range.from,
    to: range.to,
    previousFrom: formatIsoDate(previousStart),
    previousTo: formatIsoDate(previousEnd),
    previousStart: new Date(previousStart.getTime()),
    start: new Date(start.getTime()),
    end,
    timezone,
    bucket: days > 92 ? 'week' : 'day',
  }
}
