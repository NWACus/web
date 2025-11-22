import type { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { isSameDay } from 'date-fns'

export function StartAndEndDateDisplay({
  startDate,
  endDate,
  timezone,
}: Pick<Event, 'startDate' | 'endDate' | 'timezone'>) {
  return (
    <>
      {endDate && isSameDay(startDate, endDate) ? (
        <>
          <span>
            {formatDateTime(startDate, timezone, 'MMM d, yy, p')}
            <span className="mx-0.5">-</span>
            {formatDateTime(endDate, timezone, 'p zzz')}
          </span>
        </>
      ) : (
        <>
          <span>{formatDateTime(startDate, timezone, 'MMM d, yy, p')}</span>
          {endDate && (
            <>
              <span className="mx-0.5">-</span>
              <span>{formatDateTime(endDate, timezone, 'MMM d, yy, p')}</span>
            </>
          )}
        </>
      )}
    </>
  )
}
