'use client'

/**
 * Revalidate-on-view: on mount, asks the freshness endpoint whether the forecast this page shows
 * has been corrected/retracted since it was rendered (the page is ISR, so it can be up to its
 * revalidate window stale). On a change it refreshes the route so the viewer sees the current
 * forecast without a manual reload. Renders nothing.
 *
 * Safety invariant: the check always runs on mount; nothing (expiry, validity) gates it.
 */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ForecastFreshnessProps {
  center: string
  zoneSlug: string
  /** Fingerprint of the forecast this page was rendered with, sent as If-None-Match. */
  initialEtag: string
}

export function ForecastFreshness({ center, zoneSlug, initialEtag }: ForecastFreshnessProps) {
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/${center}/forecast-freshness?zone=${encodeURIComponent(zoneSlug)}`, {
      headers: { 'If-None-Match': initialEtag },
      signal: controller.signal,
    })
      .then((res) => {
        // 200 → the forecast changed since render; re-render with fresh data. 304 → unchanged.
        if (res.status === 200) router.refresh()
      })
      .catch(() => {
        // Network hiccup (or an aborted in-flight check on unmount): leave the page as-is; the
        // short ISR window still backstops freshness.
      })

    return () => controller.abort()
  }, [center, zoneSlug, initialEtag, router])

  return null
}
