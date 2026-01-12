import type { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

// Timezone-aware same-day comparison to avoid hydration mismatches
// Compares the formatted date strings in the event's timezone rather than local timezone
const isSameDayInTimezone = (
  date1: string,
  tz1: string | null | undefined,
  date2: string,
  tz2: string | null | undefined,
): boolean => {
  const day1 = formatDateTime(date1, tz1, 'yyyy-MM-dd')
  const day2 = formatDateTime(date2, tz2, 'yyyy-MM-dd')
  return day1 === day2
}

export function StartAndEndDateDisplay({
  startDate,
  startDate_tz,
  endDate,
  endDate_tz,
}: Pick<Event, 'startDate' | 'startDate_tz' | 'endDate' | 'endDate_tz'>) {
  return (
    <>
      {endDate && isSameDayInTimezone(startDate, startDate_tz, endDate, endDate_tz) ? (
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
