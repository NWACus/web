import { TZDate, tz, tzName } from '@date-fns/tz'
import { isSameDay, isSameYear } from 'date-fns'
import { format } from 'date-fns/format'

export const formatDateTime = (
  dateString: string,
  tz: string | null | undefined,
  formatStr: string,
) => {
  const date = tz ? new TZDate(dateString, tz) : new Date(dateString)

  return tz && formatStr.includes('zzz')
    ? // date-fns renders zzz as a GMT offset, so swap it for the zone's abbreviation (PST, MDT).
      `${format(date, formatStr.replace(/zzz/g, '')).trimEnd()} ${tzName(tz, date, 'short')}`
    : format(date, formatStr)
}

/**
 * An event's start and optional end as one string, e.g. `Jan 5, 2026, 3:00 PM - 5:00 PM PST`.
 * The date and year are only repeated when the end falls on a different day or year.
 */
export const formatDateTimeRange = (
  start: string,
  end: string | null | undefined,
  timeZone: string,
) => {
  if (!end) return formatDateTime(start, timeZone, 'MMM d, yyyy, p zzz')

  const inZone = { in: tz(timeZone) }
  if (isSameDay(start, end, inZone)) {
    return `${formatDateTime(start, timeZone, 'MMM d, yyyy, p')} - ${formatDateTime(end, timeZone, 'p zzz')}`
  }

  const startFormat = isSameYear(start, end, inZone) ? 'MMM d, p' : 'MMM d, yyyy, p'
  return `${formatDateTime(start, timeZone, startFormat)} - ${formatDateTime(end, timeZone, 'MMM d, yyyy, p zzz')}`
}
