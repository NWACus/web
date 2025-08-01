import { getURL } from '@/utilities/getURL'
import config from '@payload-config'
import { getServerSideSitemap } from 'next-sitemap'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

const getPagesSitemap = (center: string) =>
  unstable_cache(
    async ({ center, serverURL }: { center: string; serverURL: string }) => {
      const payload = await getPayload({ config })

      const results = await payload.find({
        collection: 'pages',
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

      const defaultSitemap = [
        {
          loc: `${serverURL}/blog`,
          lastmod: dateFallback,
        },
      ]

      const sitemap = results.docs
        ? results.docs
            .filter((page) => Boolean(page?.slug))
            .map((page) => {
              return {
                loc: `${serverURL}/${page?.slug}`,
                lastmod: page.updatedAt || dateFallback,
              }
            })
        : []

      return [...defaultSitemap, ...sitemap]
    },
    [`pages-sitemap-${center}`],
    {
      tags: ['pages-sitemap', `pages-sitemap-${center}`],
    },
  )

export async function GET(_request: Request, { params }: { params: Promise<{ center: string }> }) {
  const { center } = await params
  const headersList = await headers()
  const currentHost = headersList.get('host')
  const serverURL = getURL(currentHost)

  const sitemap = await getPagesSitemap(center)({ center, serverURL })

  return getServerSideSitemap(sitemap)
}
