import { getURL } from '@/utilities/getURL'
import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export async function GET(): Promise<Response> {
  const headersList = await headers()
  const currentHost = headersList.get('host')
  const serverURL = getURL(currentHost)

  const robots: MetadataRoute.Robots = {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/'],
    },
    sitemap: `${serverURL}/sitemap.xml`,
  }

  const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules
  const robotsTxt = `User-agent: ${rules.userAgent}
Allow: ${rules.allow}
Disallow: ${rules.disallow}

Sitemap: ${robots.sitemap}`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
