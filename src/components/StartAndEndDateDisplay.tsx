import type { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { tz } from '@date-fns/tz'
import { isSameDay } from 'date-fns'

export function StartAndEndDateDisplay({
  startDate,
  startDate_tz,
  endDate,
  endDate_tz,
}: Pick<Event, 'startDate' | 'startDate_tz' | 'endDate' | 'endDate_tz'>) {
  return (
    <>
      {endDate && isSameDay(startDate, endDate, { in: tz(startDate_tz ?? undefined) }) ? (
        <>
          <span>
            {formatDateTime(startDate, startDate_tz, 'MMM d, yyyy, p')}
            <span className="mx-0.5">-</span>
            {formatDateTime(endDate, endDate_tz, 'p zzz')}
          </span>
        </>
      ) : (
        <>
          <span>
            {formatDateTime(
              startDate,
              startDate_tz,
              endDate ? 'MMM d, yyyy, p' : 'MMM d, yyyy, p zzz',
            )}
          </span>
          {endDate && (
            <>
              <span className="mx-0.5">-</span>
              <span>{formatDateTime(endDate, endDate_tz, 'MMM d, yyyy, p zzz')}</span>
            </>
          )}
        </>
      )}
    </>
  )
}
