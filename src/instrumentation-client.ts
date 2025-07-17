// This file configures the initialization of Sentry on the client.

import * as Sentry from '@sentry/nextjs'
import sentryBaseConfig from 'sentry-base-config'

Sentry.init(sentryBaseConfig)

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
