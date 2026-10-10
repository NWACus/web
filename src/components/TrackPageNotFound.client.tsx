'use client'

import { useAnalytics } from '@/utilities/useAnalytics'
import { useEffect } from 'react'

/**
 * Records a `page_not_found` event per visitor. This has to run in the browser: the not-found
 * render is ISR-cached, so a server-side capture would fire once per revalidation, not per request.
 */
export function TrackPageNotFound() {
  const { captureWithTenant } = useAnalytics()

  useEffect(() => {
    // Child effects run before PostHogProvider's init effect, and posthog-js drops pre-init captures
    const timeout = setTimeout(() =>
      captureWithTenant('page_not_found', {
        path: window.location.pathname,
        referrer: document.referrer,
      }),
    )
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
