import { getURL } from '@/utilities/getURL'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = getURL()

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
    },
  ]
}
