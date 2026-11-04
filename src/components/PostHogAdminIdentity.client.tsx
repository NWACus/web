'use client'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'
import { getPostHogCenterProperties, getPostHogSuperProperties } from '@/utilities/useAnalytics'
import { useAuth } from '@payloadcms/ui'
import posthog from 'posthog-js'
import { useEffect, useRef } from 'react'

/**
 * Ties the admin browser's anonymous PostHog identity to the logged-in user and registers the
 * selected tenant as `center`. Must render inside PostHogProvider, below Payload's auth and
 * tenant-selection providers.
 */
export function PostHogAdminIdentity() {
  const { user } = useAuth()
  const { selectedTenantSlug } = useTenantSelection()
  const identifiedUserId = useRef<string | null>(null)
  const latestTenantSlug = useRef(selectedTenantSlug)
  latestTenantSlug.current = selectedTenantSlug

  const userId = user?.id ? String(user.id) : null
  const userEmail = user?.email
  const userName = user?.name

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

    if (userId) {
      posthog.identify(userId, { email: userEmail, name: userName })
      identifiedUserId.current = userId
    } else if (identifiedUserId.current) {
      // Logged out: stop attributing this browser's events to the previous user. reset() also
      // clears every super property, so put them back for the login page's events.
      posthog.reset()
      identifiedUserId.current = null
      posthog.register(getPostHogSuperProperties())
      if (latestTenantSlug.current) {
        posthog.register(getPostHogCenterProperties(latestTenantSlug.current))
      }
    }
  }, [userId, userEmail, userName])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

    if (selectedTenantSlug) {
      posthog.register(getPostHogCenterProperties(selectedTenantSlug))
    } else {
      posthog.unregister('center')
      posthog.unregister('tenant')
    }
  }, [selectedTenantSlug])

  return null
}
