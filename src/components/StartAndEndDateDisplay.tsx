import type { Event } from '@/payload-types'
import { formatDateTimeRange } from '@/utilities/formatDateTime'

export function StartAndEndDateDisplay({
  startDate,
  startDate_tz,
  endDate,
}: Pick<Event, 'startDate' | 'startDate_tz' | 'endDate'>) {
  return <span>{formatDateTimeRange(startDate, endDate, startDate_tz)}</span>
}
