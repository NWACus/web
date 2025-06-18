import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http'
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
const ROOT_SITE_URL = `${PROTOCOL}://${ROOT_DOMAIN}`
const url = new URL(ROOT_SITE_URL)

/** @type {import('next').NextConfig} */
const nextConfig = {
  crossOrigin: 'anonymous',
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        hostname: url.hostname,
        protocol: url.protocol.replace(':', ''),
      },
      {
        hostname: '*.' + url.hostname,
        protocol: url.protocol.replace(':', ''),
      },
    ],
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
