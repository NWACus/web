import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs'

import redirects from './redirects.js'

const PROTOCOL =
  process.env.NODE_ENV === 'production' &&
  process.env.LOCAL_FLAG_ENABLE_LOCAL_PRODUCTION_BUILDS !== 'true'
    ? 'https'
    : 'http'
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
const ROOT_SITE_URL = `${PROTOCOL}://${ROOT_DOMAIN}`
const url = new URL(ROOT_SITE_URL)

/** @type {import('next').NextConfig} */
const nextConfig = {
  crossOrigin: 'anonymous',
  images: {
    unoptimized: false,
    qualities: [75, 80],
    localPatterns: [{ pathname: '/api/**' }],
    remotePatterns: [
      {
        hostname: url.hostname,
        protocol: url.protocol.replace(':', ''),
      },
      {
        hostname: '*.' + url.hostname,
        protocol: url.protocol.replace(':', ''),
      },
      {
        hostname: 'www.avy-fx-demo.org',
        protocol: PROTOCOL,
      },
      {
        hostname: 'www.sierraavalanchecenter.org',
        protocol: PROTOCOL,
      },
      {
        hostname: 'www.sawtoothavalanche.com',
        protocol: PROTOCOL,
      },
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
      cpus: 1,
    },
  }),
}

const configWithPayload = withPayload(nextConfig, { devBundleServerPackages: false })

const configWithSentry = withSentryConfig(configWithPayload, {
  org: 'nwac',
  project: 'avy-web',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',

  // Sentry 10 moved these under `webpack:` (no Turbopack equivalent yet).
  // - removeDebugLogging: tree-shake Sentry logger statements
  // - automaticVercelMonitors: instrument Vercel Cron Monitors (still no App
  //   Router route-handler support upstream)
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
})

export default process.env.NODE_ENV === 'production' ? configWithSentry : configWithPayload
