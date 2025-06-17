import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const domain = process.env.SERVER_DOMAIN || process.env.VERCEL_URL
const url = domain
  ? `${domain.includes('localhost') ? 'http' : 'https'}://${domain}`
  : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  crossOrigin: 'anonymous',
  images: {
    unoptimized: false,
    remotePatterns: [
      ...[url]
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
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
