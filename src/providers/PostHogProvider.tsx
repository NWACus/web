'use client'

import { getRootDomainURL } from '@/utilities/getURL'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import React, { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: `${getRootDomainURL()}/ingest`,
        ui_host: 'https://us.posthog.com',
        defaults: '2025-05-24',
        debug: process.env.NODE_ENV !== 'production',
      })
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
