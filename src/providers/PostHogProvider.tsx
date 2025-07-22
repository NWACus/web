'use client'

import { defaultPostHogProperties } from '@/utilities/analytics'
import { getRootDomainURL } from '@/utilities/getURL'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import React, { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(function initPostHog() {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: `${getRootDomainURL()}/ingest`,
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
        defaults: '2025-05-24',
        debug: process.env.NODE_ENV !== 'production',
      })
    }
  }, [])

  useEffect(function addDefaultPostHogProperties() {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.register(defaultPostHogProperties)
    }
  })

  return <PHProvider client={posthog}>{children}</PHProvider>
}
