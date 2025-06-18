import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http'
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
const ROOT_SITE_URL = `${PROTOCOL}://${ROOT_DOMAIN}`

/** @type {import('next').NextConfig} */
const nextConfig = {
  crossOrigin: 'anonymous',
  images: {
    unoptimized: false,
    remotePatterns: [
      ...[ROOT_SITE_URL]
        .map((item) => {
          const url = new URL(item)

          return [
            {
              hostname: url.hostname,
              protocol: url.protocol.replace(':', ''),
            },
            {
              hostname: '*.' + url.hostname,
              protocol: url.protocol.replace(':', ''),
            },
          ]
        })
        .flat(),
    ],
  },
  reactStrictMode: true,
  redirects,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
