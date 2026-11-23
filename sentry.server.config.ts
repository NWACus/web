// This file configures the initialization of Sentry on the server.

import * as Sentry from '@sentry/nextjs'
import sentryBaseConfig from 'sentry-base-config'

Sentry.init({
  ...sentryBaseConfig,
  // Replaces the Next SDK's default Http integration, so its disableIncomingRequestSpans is repeated.
  // Request sessions would otherwise post an envelope per function invocation.
  integrations: [
    Sentry.httpIntegration({
      disableIncomingRequestSpans: true,
      trackIncomingRequestsAsSessions: false,
    }),
  ],
})
