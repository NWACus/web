'use client'

/**
 * Revalidate-on-view: on mount, asks a freshness endpoint whether the product this page shows has
 * changed since it was rendered (pages are statically generated or ISR, so they can be up to their
 * revalidate window stale). On a change it refreshes the route so the viewer sees the current
 * product without a manual reload. Renders nothing.
 *
 * Shared by every safety-critical native surface — the forecast page and the home-page warnings
 * banner today. The endpoint owns the decisions: what counts as a change, whether to purge the
 * shared caches, and whether this viewer's render is stale (200) or current (304).
 *
 * Safety invariant: the check always runs on mount. Nothing — expiry, validity, or the page
 * currently showing no alert at all — gates it.
 */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RevalidateOnViewProps {
  /** Freshness endpoint to ask, including any query string. */
  endpoint: string
  /** Fingerprint of the product this page was rendered with, sent as If-None-Match. */
  initialEtag: string
}

export function RevalidateOnView({ endpoint, initialEtag }: RevalidateOnViewProps) {
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()

    fetch(endpoint, {
      headers: { 'If-None-Match': initialEtag },
      signal: controller.signal,
    })
      .then((res) => {
        // 200 → the product changed since render; re-render with fresh data. 304 → unchanged.
        if (res.status === 200) router.refresh()
      })
      .catch(() => {
        // Network hiccup (or an aborted in-flight check on unmount): leave the page as-is; the
        // page's revalidate window still backstops freshness.
      })

    return () => controller.abort()
  }, [endpoint, initialEtag, router])

  return null
}
