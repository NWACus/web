'use client'

/**
 * Rolls the weather beside a forecast over at 6 am and 6 pm on the reader's clock. Every window is
 * rendered up front because the page around them is cached past a rollover and can stay open
 * across one.
 */
import { useEffect, useState, type ReactNode } from 'react'

import { windowShowing } from '@/services/nac/nwacWeatherWindow'

const CHECK_INTERVAL_MS = 60 * 1000

export function WindowRollover({ windows }: { windows: { startsAt: string; node: ReactNode }[] }) {
  // Starts at the first window, as the server rendered it, so a cached page hydrates cleanly.
  const [showing, setShowing] = useState(windows[0]?.startsAt)

  useEffect(() => {
    const check = () => setShowing(windowShowing(windows, new Date()).startsAt)
    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [windows])

  return windows.find((w) => w.startsAt === showing)?.node ?? null
}
