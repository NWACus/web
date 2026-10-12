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
 * An event's start and end as two halves, e.g. `Jan 5, 2026, 3:00 PM` and `5:00 PM PST`, so each
 * can be annotated separately. The end carries the zone, and the date and year are only repeated
 * when the end falls on a different day or year.
 */
export const splitDateTimeRange = (start: string, end: string, timeZone: string) => {
  const inZone = { in: tz(timeZone) }
  if (isSameDay(start, end, inZone)) {
    return {
      sameDay: true,
      start: formatDateTime(start, timeZone, 'MMM d, yyyy, p'),
      end: formatDateTime(end, timeZone, 'p zzz'),
    }
  }

  const startFormat = isSameYear(start, end, inZone) ? 'MMM d, p' : 'MMM d, yyyy, p'
  return {
    sameDay: false,
    start: formatDateTime(start, timeZone, startFormat),
    end: formatDateTime(end, timeZone, 'MMM d, yyyy, p zzz'),
  }
}
