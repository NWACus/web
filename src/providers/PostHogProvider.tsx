'use client'

import { useTenant } from '@/providers/TenantProvider'
import { ANALYTICS_PROPERTY } from '@/utilities/analytics'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import React, { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant()

  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      defaults: '2025-05-24',
      capture_exceptions: true,
      debug: process.env.NODE_ENV === 'development',
    })
  }, [])

  // Register tenant as a global property for all events (including autocapture)
  useEffect(() => {
    posthog.register({
      [ANALYTICS_PROPERTY.TENANT]: tenant?.slug ?? 'unknown',
    })
  }, [tenant?.slug])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
