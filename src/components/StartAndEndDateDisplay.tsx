import { ZonedDateTime } from '@/components/ZonedDateTime'
import type { Course, Event } from '@/payload-types'
import { formatDateRange } from '@/utilities/formatDateTime'

type StartAndEndDates = Pick<Event | Course, 'startDate' | 'startDate_tz' | 'endDate'>

type StartAndEndDateDisplayProps = StartAndEndDates & {
  /** Set false to show calendar dates only, with no time of day or timezone. */
  showTime?: boolean
}

export function StartAndEndDateDisplay({
  startDate,
  startDate_tz,
  endDate,
  showTime = true,
}: StartAndEndDateDisplayProps) {
  return showTime ? (
    <ZonedDateTime dateTime={startDate} endDateTime={endDate} timeZone={startDate_tz} />
  ) : (
    <time dateTime={startDate}>{formatDateRange(startDate, endDate, startDate_tz)}</time>
  )
}
