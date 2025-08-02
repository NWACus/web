import { getURL } from '@/utilities/getURL'
import config from '@payload-config'
import { getServerSideSitemap } from 'next-sitemap'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { SitemapField } from '../../sitemap.xml/route'

const getPostsSitemap = (center: string) =>
  unstable_cache(
    async ({
      center,
      serverURL,
    }: {
      center: string
      serverURL: string
    }): Promise<SitemapField[]> => {
      const payload = await getPayload({ config })

      const results = await payload.find({
        collection: 'posts',
        depth: 0,
        limit: 1000,
        pagination: false,
        where: {
          _status: {
            equals: 'published',
          },
          'tenant.slug': {
            equals: center,
          },
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      })

      const dateFallback = new Date().toISOString()

      const sitemap: SitemapField[] = results.docs
        ? results.docs
            .filter((post) => Boolean(post?.slug))
            .map((post) => ({
              loc: `${serverURL}/blog/${post?.slug}`,
              lastmod: post.updatedAt || dateFallback,
              changefreq: 'daily',
            }))
        : []

      return sitemap
    },
    [`posts-sitemap-${center}`],
    {
      tags: ['posts-sitemap', `posts-sitemap-${center}`],
    },
  )

export async function GET(_request: Request, { params }: { params: Promise<{ center: string }> }) {
  const { center } = await params
  const headersList = await headers()
  const currentHost = headersList.get('host')
  const serverURL = getURL(currentHost)

  const sitemap = await getPostsSitemap(center)({ center, serverURL })

  return getServerSideSitemap(sitemap)
}
