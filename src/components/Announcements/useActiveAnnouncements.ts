'use client'

import type { ActiveAnnouncements } from '@/utilities/queries/getActiveAnnouncements'
import { useEffect, useState } from 'react'

const NONE: ActiveAnnouncements = { banners: [], popups: [] }

// Read in the browser so announcements can change by the minute while the page around them
// stays cached for as long as its route declares. See docs/revalidation.md.
export function useActiveAnnouncements(center: string): ActiveAnnouncements {
  const [announcements, setAnnouncements] = useState(NONE)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/${center}/announcements`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((active: ActiveAnnouncements) => setAnnouncements(active))
      .catch(() => {
        // A failed read shows no announcements, and the next page load tries again.
      })
    return () => controller.abort()
  }, [center])

  return announcements
}
