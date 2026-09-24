'use client'

/**
 * Lands a legacy widget link on the native viewer. Centers published the widget's hash addresses
 * upstream (`obs_view_url` is `…/observations/#/view/observations` for some), and a hash never
 * reaches the server, so the page can only notice it here.
 *
 * A full `location.replace` rather than a router navigation: the target is often this same page
 * with the widget's filters moved into the query string, and the viewer reads its filters from the
 * URL once, as it mounts — a soft navigation could land after that read. Replacing also keeps the
 * hash address out of history, so back doesn't bounce the reader through it again.
 */
import { useEffect } from 'react'

import { legacyHashTarget, readViewerPath } from '@/services/nac/observations/routes'

export function LegacyHashRedirect() {
  useEffect(() => {
    const target = legacyHashTarget(window.location.hash)
    if (!target) return
    const prefix = readViewerPath(window.location.pathname)?.prefix ?? ''
    window.location.replace(`${prefix}${target}`)
  }, [])
  return null
}
