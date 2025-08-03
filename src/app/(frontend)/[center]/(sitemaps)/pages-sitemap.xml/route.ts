import {
  extractAllInternalUrls,
  getCachedTopLevelNavItems,
  getCanonicalUrlsFromNavigation,
} from '@/components/Header/utils'
import { getURL } from '@/utilities/getURL'
import config from '@payload-config'
import { getServerSideSitemap } from 'next-sitemap'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { SitemapField } from '../../sitemap.xml/route'

const getPagesSitemap = (center: string) =>
  unstable_cache(
    async ({
      center,
      serverURL,
    }: {
      center: string
      serverURL: string
    }): Promise<SitemapField[]> => {
      const payload = await getPayload({ config })

      const topLevelNavItems = await getCachedTopLevelNavItems(center)(center)
      const navigationUrls = extractAllInternalUrls(topLevelNavItems)

      const pagesRes = await payload.find({
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

      const { canonicalUrls, excludedSlugs } = getCanonicalUrlsFromNavigation(
        navigationUrls,
        pagesRes.docs || [],
      )

      const navigationSitemap: SitemapField[] = canonicalUrls.map((url) => {
        const pageSlug = url.split('/').filter(Boolean).pop()
        const matchingPage = pagesRes.docs?.find((page) => page.slug === pageSlug)

        return {
          loc: `${serverURL}${url}`,
          lastmod: matchingPage?.updatedAt || dateFallback,
        }
      })

      // Exclude those that are canonical in navigation
      const pagesSitemap: SitemapField[] = pagesRes.docs
        ? pagesRes.docs
            .filter((page) => Boolean(page?.slug) && !excludedSlugs.includes(page.slug))
            .map((page) => {
              return {
                loc: `${serverURL}/${page?.slug}`,
                lastmod: page.updatedAt || dateFallback,
              }
            })
        : []

      const combinedSitemap: SitemapField[] = [
        {
          loc: serverURL,
          lastmod: dateFallback,
        },
        ...navigationSitemap,
        ...pagesSitemap,
      ]

      return combinedSitemap
    },
    [`pages-sitemap-${center}`],
    {
      tags: ['pages-sitemap', `pages-sitemap-${center}`, 'navigation', `navigation-${center}`],
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
