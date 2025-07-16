'use client'

import { useTenant } from '@/providers/TenantProvider'
import { ANALYTICS_PROPERTY } from '@/utilities/analytics'
import posthog from 'posthog-js'
import { useEffect } from 'react'

export function PostHogTenantRegister() {
  const { tenant } = useTenant()
  useEffect(() => {
    if (tenant?.slug) {
      posthog.register({
        [ANALYTICS_PROPERTY.TENANT]: tenant.slug,
      })
    }
  }, [tenant?.slug])
  return null
}
