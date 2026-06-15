'use client'

import type { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import { tz } from '@date-fns/tz'
import { isSameDay, isSameYear } from 'date-fns'
import { useEffect, useState } from 'react'

function BrowserTimeHint({
  dateString,
  eventTz,
}: {
  dateString: string
  eventTz: string | null | undefined
}) {
  const [localTime, setLocalTime] = useState<string | null>(null)

  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!eventTz || browserTz === eventTz) return
    if (!TIMEZONE_OPTIONS.some((opt) => opt.value === browserTz)) return
    setLocalTime(formatDateTime(dateString, browserTz, 'h:mm a zzz'))
  }, [dateString, eventTz])

  if (!localTime) return null
  return <span className="text-muted-foreground"> ({localTime})</span>
}

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
        <BrowserTimeHint dateString={endDate} eventTz={endDate_tz} />
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
      {!endDate && <BrowserTimeHint dateString={startDate} eventTz={startDate_tz} />}
      {endDate && (
        <>
          {' - '}
          {formatDateTime(endDate, endDate_tz, 'MMM d, yyyy, p zzz')}
          <BrowserTimeHint dateString={endDate} eventTz={endDate_tz} />
        </>
      )}
    </span>
  )
}
