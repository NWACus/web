'use client'

/**
 * Revalidate-on-view: asks one or more freshness endpoints whether the products this page shows
 * have changed since it was rendered (pages are statically generated or ISR, so they can be up to
 * their revalidate window stale). On a change it refreshes the route so the viewer sees the current
 * products without a manual reload. Renders nothing.
 *
 * Shared by every safety-critical native surface — the forecast page, the all-zones grid, and the
 * home-page warnings banner. The endpoints own the decisions: what counts as a change, whether to
 * purge the shared caches, and whether this viewer's render is stale.
 *
 * An endpoint is **content-addressed**: the fingerprint of what this page rendered is baked into
 * the URL rather than sent as a header, which is what lets the "you're current" answer be served
 * from the edge. It also means the URL changes when the product does, so after a `router.refresh()`
 * the RSC payload hands us new `endpoints` and the effect re-arms on its own.
 *
 * A page that shows several products asks about all of them in one component rather than mounting
 * one instance per product. That keeps a single timer and a single visibility listener, and — the
 * reason it matters — collapses a daily publish that moves every zone at once into **one**
 * `router.refresh()` instead of one per zone. The all-zones grid reuses the very same per-zone
 * addresses the individual forecast pages ask, so it shares their edge cache entries and adds no
 * origin traffic of its own.
 *
 * Safety invariants:
 * - The check always runs on mount. Nothing — expiry, validity, or the page currently showing no
 *   alert at all — gates it.
 * - Freshness is an **open-tab** guarantee, not just a page-load one. These pages get left open all
 *   day in patrol rooms, forecast offices and on wall displays, so a tab that has been up for hours
 *   has to keep asking: on every return to visibility, and on a slow interval while visible. The
 *   interval is set so that an untouched tab's worst case stays inside the page's own ISR window —
 *   see `RECHECK_INTERVAL_MS`.
 */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import type { FreshnessAnswer } from '@/utilities/freshnessResponses'

/**
 * Backstop for a tab that is visible but untouched. The visibility trigger covers the common case,
 * and almost every one of these requests is answered from the edge, so this can stay slow.
 *
 * Two minutes rather than five, so that the open-tab guarantee is at least as good as the one this
 * whole path exists because it thinks is too weak. A check's own detection budget is 60s (30s
 * upstream fresh-fetch cache + 30s at the edge), so at a five-minute interval an untouched tab's
 * worst case was ~360s — *longer* than the 300s ISR window. At two minutes it is 180s, comfortably
 * inside the backstop.
 */
const RECHECK_INTERVAL_MS = 2 * 60 * 1000

/**
 * The shortest gap between two checks. Returning to visibility re-checks, and nothing else bounds
 * how often that fires — a viewer cycling between windows would spend one request per endpoint per
 * flip, which on the all-zones grid is a dozen.
 *
 * Matched to the unchanged answer's edge TTL, because inside that window the edge has nothing newer
 * to say: a suppressed check costs no freshness at all. It also cannot starve the check, being far
 * shorter than the interval above — a viewer flipping faster than the floor still gets a check
 * every 30s, which is more often than the interval would have managed.
 */
const MIN_CHECK_INTERVAL_MS = 30 * 1000

/** Not a URL character, so joining on it round-trips any set of endpoints exactly. */
const KEY_SEPARATOR = '\n'

interface RevalidateOnViewProps {
  /** Complete freshness endpoint URLs, each including its rendered product's fingerprint. */
  endpoints: string[]
}

export function RevalidateOnView({ endpoints }: RevalidateOnViewProps) {
  const router = useRouter()

  // The effect must re-arm when the *contents* change, not on every new array identity a re-render
  // produces. The joined list is that value, and splitting it back inside keeps the dependency
  // honest rather than suppressing the lint rule.
  const endpointKey = endpoints.join(KEY_SEPARATOR)

  useEffect(() => {
    const urls = endpointKey.split(KEY_SEPARATOR).filter(Boolean)
    if (urls.length === 0) return

    const controller = new AbortController()
    let interval: ReturnType<typeof setInterval> | undefined
    let lastCheckAt = 0

    function check() {
      lastCheckAt = Date.now()
      Promise.all(
        urls.map((url) =>
          fetch(url, { signal: controller.signal })
            .then((res): Promise<FreshnessAnswer> | null => (res.ok ? res.json() : null))
            .catch(() => {
              // Network hiccup, an unparseable body, or an aborted in-flight check on unmount:
              // leave the page as-is; the page's revalidate window still backstops freshness. One
              // endpoint failing must not sink the answers from the others.
              return null
            }),
        ),
      ).then((answers) => {
        // Anything short of an explicit "changed" leaves the page alone — an indeterminate answer
        // means upstream couldn't be established, not that the product went away. One refresh
        // however many moved: a daily publish changes every zone on the grid at once.
        if (answers.some((answer) => answer?.changed === true)) router.refresh()
      })
    }

    /** The visibility path, which is the only one a viewer can fire at will. */
    function checkIfDue() {
      if (Date.now() - lastCheckAt < MIN_CHECK_INTERVAL_MS) return
      check()
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
      checkIfDue()
      startInterval()
    }

    // Unconditional, and deliberately not through `checkIfDue`: the mount check is a safety
    // invariant, not something the floor above gets a say in.
    check()
    if (document.visibilityState !== 'hidden') startInterval()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      controller.abort()
      stopInterval()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [endpointKey, router])

  return null
}
