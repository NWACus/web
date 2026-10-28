import { ZonedDateTime } from '@/components/ZonedDateTime'
import type { Course, Event } from '@/payload-types'
import { formatDateRange } from '@/utilities/formatDateTime'

type StartAndEndDates = Pick<Event | Course, 'startDate' | 'startDate_tz' | 'endDate'>

type StartAndEndDateDisplayProps = StartAndEndDates & {
  /** Show calendar dates only, with no time of day or timezone. */
  dateOnly?: boolean
}

export function StartAndEndDateDisplay({
  startDate,
  startDate_tz,
  endDate,
  dateOnly = false,
}: StartAndEndDateDisplayProps) {
  if (dateOnly) {
    return <time dateTime={startDate}>{formatDateRange(startDate, endDate, startDate_tz)}</time>
  }
  return <ZonedDateTime dateTime={startDate} endDateTime={endDate} timeZone={startDate_tz} />
}
