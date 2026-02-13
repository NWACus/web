import type { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { tz } from '@date-fns/tz'
import { isSameDay, isSameYear } from 'date-fns'

export function StartAndEndDateDisplay({
  startDate,
  startDate_tz,
  endDate,
  endDate_tz,
}: Pick<Event, 'startDate' | 'startDate_tz' | 'endDate' | 'endDate_tz'>) {
  const sameDay = endDate && isSameDay(startDate, endDate, { in: tz(startDate_tz) })
  const sameYear = endDate && isSameYear(startDate, endDate, { in: tz(startDate_tz) })

  if (sameDay) {
    return (
      <span>
        {formatDateTime(startDate, startDate_tz, 'MMM d, yyyy, p')} -{' '}
        {formatDateTime(endDate, endDate_tz, 'p zzz')}
      </span>
    )
  }

  return (
    <span>
      {formatDateTime(
        startDate,
        startDate_tz,
        endDate ? (sameYear ? 'MMM d, p' : 'MMM d, yyyy, p') : 'MMM d, yyyy, p zzz',
      )}
      {endDate && (
        <>
          {' - '}
          {formatDateTime(endDate, endDate_tz, 'MMM d, yyyy, p zzz')}
        </>
      )}
    </span>
  )
}
