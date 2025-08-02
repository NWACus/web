import { getURL } from '@/utilities/getURL'
import { getServerSideSitemapIndex } from 'next-sitemap'
import { headers } from 'next/headers'

export type SitemapField = {
  loc: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

export async function GET() {
  const headersList = await headers()
  const currentHost = headersList.get('host')
  const serverURL = getURL(currentHost)

  const sitemaps = [`${serverURL}/pages-sitemap.xml`, `${serverURL}/posts-sitemap.xml`]

  return getServerSideSitemapIndex(sitemaps)
}
