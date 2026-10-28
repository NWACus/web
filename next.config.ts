import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

import redirects from './redirects.js'
import { centerRemotePatterns } from './src/utilities/tenancy/centerRemotePatterns'

const PROTOCOL: 'http' | 'https' =
  process.env.NODE_ENV === 'production' &&
  process.env.LOCAL_FLAG_ENABLE_LOCAL_PRODUCTION_BUILDS !== 'true'
    ? 'https'
    : 'http'
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
const ROOT_SITE_URL = `${PROTOCOL}://${ROOT_DOMAIN}`
const url = new URL(ROOT_SITE_URL)

const nextConfig: NextConfig = {
  // The mocked E2E build writes to its own directory, so a build made against the real AFP API can
  // never be mistaken for one made against the fixtures. See docs/afp-products/e2e-mocks.md.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  crossOrigin: 'anonymous',
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        hostname: url.hostname,
        protocol: PROTOCOL,
      },
      {
        hostname: `*.${url.hostname}`,
        protocol: PROTOCOL,
      },
      ...centerRemotePatterns(PROTOCOL),
    ],
  },
  reactStrictMode: true,
  redirects,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ]
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  // Resolves an error from Sentry
  // Reference: https://github.com/getsentry/sentry-javascript/issues/15209#issuecomment-2820494802
  serverExternalPackages: ['require-in-the-middle', 'import-in-the-middle'],
  webpack: (config) => {
    // Ignores a nasty-looking but apparently harmless error resulting from importing Sentry in client components
    // Reference: https://github.com/getsentry/sentry-javascript/issues/12077#issuecomment-2407569917
    config.ignoreWarnings = [{ module: /@opentelemetry\/instrumentation/ }]
    return config
  },
  ...(process.env.LOCAL_FLAG_ENABLE_FULL_URL_LOGGING === 'true' && {
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }),
  ...(process.env.LOCAL_FLAG_ENABLE_LOCAL_PRODUCTION_BUILDS === 'true' && {
    experimental: {
      // to solve https://github.com/WiseLibs/better-sqlite3/issues/1155
      workerThreads: false,
    },
  }),
}

const configWithPayload = withPayload(nextConfig, { devBundleServerPackages: false })

const sentryWrappedConfig = withSentryConfig(configWithPayload, {
  org: 'nwac',
  project: 'avy-web',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  automaticVercelMonitors: true,
})

// withSentryConfig sets experimental.clientTraceMetadata, so Next renders per-request sentry-trace
// and baggage meta tags that make every ISR revalidation a write. See docs/error-tracking.md.
const { clientTraceMetadata: _clientTraceMetadata, ...sentryExperimental } =
  sentryWrappedConfig.experimental ?? {}
const configWithSentry = { ...sentryWrappedConfig, experimental: sentryExperimental }

// The mocked E2E build is a production build, but it must not carry Sentry: the SDK's module
// instrumentation is loaded even when reporting is disabled, and it does not co-exist with the
// harness's MSW preload — both hook module loading, and together they produce intermittent 5xx.
// Only the mocked build is affected; production has no preload. See
// docs/afp-products/e2e-mocks.md.
export default process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_E2E_MOCK_ROLE
  ? configWithSentry
  : configWithPayload
