'use client'

/**
 * Revalidate-on-view: asks a freshness endpoint whether the product this page shows has changed
 * since it was rendered (pages are statically generated or ISR, so they can be up to their
 * revalidate window stale). On a change it refreshes the route so the viewer sees the current
 * product without a manual reload. Renders nothing.
 *
 * Shared by every safety-critical native surface — the forecast page and the home-page warnings
 * banner today. The endpoint owns the decisions: what counts as a change, whether to purge the
 * shared caches, and whether this viewer's render is stale.
 *
 * The endpoint is **content-addressed**: the fingerprint of what this page rendered is baked into
 * the URL rather than sent as a header, which is what lets the "you're current" answer be served
 * from the edge. It also means the URL changes when the product does, so after a `router.refresh()`
 * the RSC payload hands us a new `endpoint` and the effect re-arms on its own.
 *
 * Safety invariants:
 * - The check always runs on mount. Nothing — expiry, validity, or the page currently showing no
 *   alert at all — gates it.
 * - Freshness is an **open-tab** guarantee, not just a page-load one. These pages get left open all
 *   day in patrol rooms, forecast offices and on wall displays, so a tab that has been up for hours
 *   has to keep asking: on every return to visibility, and on a slow interval while visible.
 */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import type { FreshnessAnswer } from '@/utilities/freshnessResponses'

/**
 * Backstop for a tab that is visible but untouched. Deliberately slow: the visibility trigger
 * covers the common case, and almost every one of these requests is answered from the edge.
 */
const RECHECK_INTERVAL_MS = 5 * 60 * 1000

interface RevalidateOnViewProps {
  /** The complete freshness endpoint URL, including the rendered product's fingerprint. */
  endpoint: string
}

export function RevalidateOnView({ endpoint }: RevalidateOnViewProps) {
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()
    let interval: ReturnType<typeof setInterval> | undefined

    function check() {
      fetch(endpoint, { signal: controller.signal })
        .then((res): Promise<FreshnessAnswer> | null => (res.ok ? res.json() : null))
        .then((answer) => {
          // Anything short of an explicit "changed" leaves the page alone — an indeterminate
          // answer means upstream couldn't be established, not that the product went away.
          if (answer?.changed === true) router.refresh()
        })
        .catch(() => {
          // Network hiccup, an unparseable body, or an aborted in-flight check on unmount: leave
          // the page as-is; the page's revalidate window still backstops freshness.
        })
    }

    function stopInterval() {
      if (interval === undefined) return
      clearInterval(interval)
      interval = undefined
    }

    // Always replaces any existing timer, so flipping visibility can't accumulate them.
    function startInterval() {
      stopInterval()
      interval = setInterval(check, RECHECK_INTERVAL_MS)
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stopInterval()
        return
      }
      check()
      startInterval()
    }

    check()
    if (document.visibilityState !== 'hidden') startInterval()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      controller.abort()
      stopInterval()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [endpoint, router])

  return null
}
