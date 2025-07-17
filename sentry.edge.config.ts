// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).

import * as Sentry from '@sentry/nextjs'
import sentryBaseConfig from 'sentry-base-config'

Sentry.init(sentryBaseConfig)
