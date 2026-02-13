import { getURL } from '@/utilities/getURL'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = getURL()

  return {
    rules: [
      {
        userAgent: 'facebookexternaluser',
        disallow: '/',
      },
      {
        userAgent: 'facebookexternaluser',
        disallow: '/',
      },
      {
        userAgent: 'Twitterbot',
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/'],
      },
      {
        userAgent: '*',
        disallow: ['/*.pdf', '/*.jpg', '/*.jpeg', '/*.png', '/*.gif', '/*.svg', '/*.webp'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
