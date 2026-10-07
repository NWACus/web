import { ZonedDateTime } from '@/components/ZonedDateTime'
import type { Event } from '@/payload-types'

type StartAndEndDateDisplayProps = Pick<Event, 'startDate' | 'startDate_tz' | 'endDate'>

export function StartAndEndDateDisplay({
  startDate,
  startDate_tz,
  endDate,
}: StartAndEndDateDisplayProps) {
  return <ZonedDateTime dateTime={startDate} endDateTime={endDate} timeZone={startDate_tz} />
}
