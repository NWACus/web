'use client'

import { getRootDomainURL } from '@/utilities/getURL'
import { getPostHogSuperProperties } from '@/utilities/useAnalytics'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import React, { useEffect } from 'react'

type PersistenceMode =
  | 'cookie'
  | 'localStorage'
  | 'localStorage+cookie'
  | 'sessionStorage'
  | 'memory'

// Rendered before `children` so its effect runs before any descendant's: React commits effects
// child-first, so a descendant calling posthog.register() before init() is a silent no-op.
// posthog-js fires the initial $pageview on a timer after init(), so super properties registered
// anywhere in this same effect pass land on it.
function PostHogInit({ persistence }: { persistence: PersistenceMode }) {
  useEffect(
    function initPostHog() {
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host: `${getRootDomainURL()}/ingest`,
          ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
          defaults: '2025-05-24',
          debug: process.env.NODE_ENV !== 'production',
          persistence, // localStorage+cookie is the PostHog default
          advanced_disable_feature_flags_on_first_load: true,
          advanced_disable_feature_flags: true,
          disable_surveys: true,
        })
        posthog.register(getPostHogSuperProperties())
      }
    },
    [persistence],
  )

  return null
}

export function PostHogProvider({
  children,
  persistence = 'localStorage+cookie',
}: {
  children: React.ReactNode
  persistence?: PersistenceMode
}) {
  return (
    <PHProvider client={posthog}>
      <PostHogInit persistence={persistence} />
      {children}
    </PHProvider>
  )
}
