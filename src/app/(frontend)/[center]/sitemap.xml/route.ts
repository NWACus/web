import { getURL } from '@/utilities/getURL'
import { getServerSideSitemapIndex } from 'next-sitemap'
import { headers } from 'next/headers'

export async function GET() {
  const headersList = await headers()
  const currentHost = headersList.get('host')
  const serverURL = getURL(currentHost)

  const sitemaps = [`${serverURL}/pages-sitemap.xml`, `${serverURL}/posts-sitemap.xml`]

  return getServerSideSitemapIndex(sitemaps)
}
