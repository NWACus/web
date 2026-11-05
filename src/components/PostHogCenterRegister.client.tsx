'use client'

import { useTenant } from '@/providers/TenantProvider'
import { getPostHogCenterProperties } from '@/utilities/useAnalytics'
import posthog from 'posthog-js'
import { useEffect } from 'react'

export function PostHogCenterRegister() {
  const { tenant } = useTenant()
  const slug = tenant?.slug

  useEffect(() => {
    if (slug) {
      posthog.register(getPostHogCenterProperties(slug))
    }
  }, [slug])

  return null
}
