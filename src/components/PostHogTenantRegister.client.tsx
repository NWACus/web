'use client'

import { useTenant } from '@/providers/TenantProvider'
import posthog from 'posthog-js'
import { useEffect } from 'react'

export function PostHogTenantRegister() {
  const { tenant } = useTenant()

  useEffect(() => {
    if (tenant?.slug) {
      posthog.register({
        tenant: tenant.slug,
      })
    }
  }, [tenant?.slug])

  return null
}
