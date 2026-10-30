// This file configures the initialization of Sentry on the client.

import * as Sentry from '@sentry/nextjs'
import sentryBaseConfig from 'sentry-base-config'

Sentry.init({
  ...sentryBaseConfig,
  // Nobody uses Release Health, and sessions add a request per page load. See docs/error-tracking.md.
  integrations: (defaults) => defaults.filter(({ name }) => name !== 'BrowserSession'),
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
