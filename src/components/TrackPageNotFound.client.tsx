'use client'

import { useAnalytics } from '@/utilities/useAnalytics'
import { useEffect } from 'react'

/**
 * Records a `page_not_found` event per visitor. This has to run in the browser: the not-found
 * render is ISR-cached, so a server-side capture would fire once per revalidation, not per request.
 */
export function TrackPageNotFound() {
  const { capture } = useAnalytics()

  useEffect(() => {
    capture('page_not_found', {
      path: window.location.pathname,
      referrer: document.referrer,
    })
  }, [capture])

  return null
}
