'use client'

/**
 * Drops the forecast's night at midnight in the center's timezone. Both versions are rendered up
 * front and the reader's clock picks, because the page around them is cached past midnight and can
 * stay open across it.
 */
import { useEffect, useState, type ReactNode } from 'react'

import { todayInTimezone } from '@/services/nac/forecastArchive'

const CHECK_INTERVAL_MS = 60 * 1000

export function MidnightRollover({
  rollsOn,
  timezone,
  beforeMidnight,
  afterMidnight,
}: {
  /** `YYYY-MM-DD` */
  rollsOn: string
  timezone: string | null | undefined
  beforeMidnight: ReactNode
  afterMidnight: ReactNode
}) {
  // Starts as the server rendered it, so a page cached over midnight still hydrates cleanly.
  const [rolled, setRolled] = useState(false)

  useEffect(() => {
    const check = () => setRolled(todayInTimezone(timezone) >= rollsOn)
    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [rollsOn, timezone])

  return rolled ? afterMidnight : beforeMidnight
}
