'use client'

/**
 * The "This product is expired." half of the validity banner, made reactive to the clock.
 *
 * Expiry is the one piece of forecast state that changes with no upstream event behind it: a
 * forecast can lapse with no replacement published, so the freshness check correctly reports
 * "nothing changed" and this banner is the viewer's only signal. Computed server-side it would be
 * baked into the ISR HTML — stale on load, and frozen forever on a tab left open across the expiry
 * instant.
 *
 * So the server's answer is rendered first and then re-evaluated on the client:
 *
 * - `initiallyExpired` is what the server decided, and it is also this component's initial state,
 *   so hydration matches. Computing `Date.now()` during the client's first render would not.
 * - The effect re-evaluates immediately, which also corrects HTML that was rendered before the
 *   expiry instant and served after it.
 * - A single `setTimeout` to the expiry instant, not a poll. Browsers throttle timers in background
 *   tabs, so returning to visibility re-evaluates rather than trusting the timer to have fired.
 * - `role="alert"`, because the notice can arrive on a page that has already been read. Inserted
 *   silently it would be announced to nobody, and for a product that lapses with no replacement
 *   this is the only signal there is. Matches the sibling `WarningBanner` bulletins.
 *
 * Expiry is an absolute-instant comparison against `expires_time`; the noon valid-date rule applies
 * to which day a product is *for*, not to when it lapses.
 */
import { TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

/** `setTimeout` overflows past a signed 32-bit millisecond delay and fires immediately. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1

interface ExpiryNoticeProps {
  /** The product's expiry instant, as an ISO timestamp. */
  expiresTime: string
  /** Whether that instant had already passed when the server rendered this page. */
  initiallyExpired: boolean
}

export function ExpiryNotice({ expiresTime, initiallyExpired }: ExpiryNoticeProps) {
  const [expired, setExpired] = useState(initiallyExpired)
  const [answeredFor, setAnsweredFor] = useState(expiresTime)

  // A refresh that brings a replacement forecast reconciles this component in place rather than
  // remounting it, so without this the "expired" it latched onto for the previous product would sit
  // over the new one until a full reload — the daily publish, on exactly the tabs this exists for.
  // Adjusting state during render rather than in an effect means the correction lands before paint.
  if (answeredFor !== expiresTime) {
    setAnsweredFor(expiresTime)
    setExpired(initiallyExpired)
  }

  useEffect(() => {
    if (expired) return

    const expiresAt = new Date(expiresTime).getTime()
    if (Number.isNaN(expiresAt)) return

    let timer: ReturnType<typeof setTimeout> | undefined

    function evaluate() {
      timer = undefined
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        setExpired(true)
        return
      }
      // Beyond the timer ceiling there is nothing useful to schedule; a tab open that long will be
      // caught by the visibility check instead.
      if (remaining <= MAX_TIMEOUT_MS) timer = setTimeout(evaluate, remaining)
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') return
      if (timer !== undefined) clearTimeout(timer)
      evaluate()
    }

    evaluate()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (timer !== undefined) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [expired, expiresTime])

  if (!expired) return null

  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>This product is expired.</span>
    </div>
  )
}
