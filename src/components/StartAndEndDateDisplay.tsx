import { ZonedDateTime } from '@/components/ZonedDateTime'
import type { Event } from '@/payload-types'

type StartAndEndDateDisplayProps = Pick<Event, 'startDate' | 'startDate_tz' | 'endDate'> & {
  viewerTimeHint?: boolean
}

export function StartAndEndDateDisplay({
  startDate,
  startDate_tz,
  endDate,
  viewerTimeHint,
}: StartAndEndDateDisplayProps) {
  return (
    <ZonedDateTime
      dateTime={startDate}
      endDateTime={endDate}
      timeZone={startDate_tz}
      viewerTimeHint={viewerTimeHint}
    />
  )
}
