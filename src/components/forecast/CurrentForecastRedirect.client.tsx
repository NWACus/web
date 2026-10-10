'use client'

/**
 * On a dated page that might show the live product, asks the live product's date when the page
 * is viewed and, if it is this page's own date, replaces the address with the live one — which
 * carries the warning banner and the freshness check a dated page doesn't. Decided here rather
 * than when the page renders, because the page is cached for weeks and the answer changes daily
 * (see `currentForecastDate.ts`). Any failure leaves the reader where they are. Renders nothing.
 */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface CurrentForecastRedirectProps {
  /** False when the page's date can't be the live product's; nothing is asked. */
  enabled: boolean
  /** The zone's `forecast-current-date` address. */
  endpoint: string
  /** This page's date, `YYYY-MM-DD`. */
  date: string
  /** The zone's live address. */
  liveHref: string
}

export function CurrentForecastRedirect({
  enabled,
  endpoint,
  date,
  liveHref,
}: CurrentForecastRedirectProps) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    void isLiveProductDate(endpoint, date).then((isLive) => {
      if (isLive && !cancelled) router.replace(liveHref)
    })

    return () => {
      cancelled = true
    }
  }, [enabled, endpoint, date, liveHref, router])

  return null
}

async function isLiveProductDate(endpoint: string, date: string): Promise<boolean> {
  try {
    const res = await fetch(endpoint)
    if (!res.ok) return false
    const body: { date?: string | null } = await res.json()
    return body.date === date
  } catch {
    return false
  }
}
