'use client'

import { normalizePath } from '@/utilities/path'
import { useHash } from '@/utilities/useHash'
import { match } from 'path-to-regexp'
import { useEffect } from 'react'
import {
  getMatchersByWidgetPage,
  isValidPath,
  PathMatcher,
  WidgetPageWithRouterKey,
} from './widgetRouter'

export function WidgetRouterHandler({
  initialPath,
  widgetPageKey,
}: {
  initialPath: string
  widgetPageKey: WidgetPageWithRouterKey
}) {
  const observedHash = useHash()

  const normalizedInitialPath = normalizePath(initialPath, { ensureLeadingSlash: true })

  let validPathMatchers: PathMatcher[]

  if (widgetPageKey) {
    validPathMatchers = getMatchersByWidgetPage(widgetPageKey)
  } else {
    validPathMatchers = [match(normalizedInitialPath)]
  }

  useEffect(() => {
    const hash = window.location.hash
    // Strip leading # from hash for path matching
    const hashSansHash = hash?.replace(/^#/, '') || ''
    // Ignore query parameters
    const hashPath = hashSansHash.split('?')[0]
    const isValid = hashPath && isValidPath(hashPath, validPathMatchers)

    if (!isValid) {
      window.history.replaceState(null, '', `#${normalizedInitialPath}`)
      return
    }
  }, [observedHash, normalizedInitialPath, validPathMatchers])

  return null
}
