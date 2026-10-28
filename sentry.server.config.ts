// This file configures the initialization of Sentry on the server.

import * as Sentry from '@sentry/nextjs'
import sentryBaseConfig from 'sentry-base-config'

Sentry.init({
  ...sentryBaseConfig,
  // Request sessions post an envelope per function invocation; replaces the default Http integration.
  integrations: [Sentry.httpIntegration({ trackIncomingRequestsAsSessions: false })],
})
