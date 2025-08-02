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

      // Get canonical URLs and determine which page slugs to exclude
      const { canonicalUrls, excludedSlugs } = getCanonicalUrlsFromNavigation(
        navigationUrls,
        pagesRes.docs || [],
      )

      // Create sitemap entries for navigation URLs (canonical)
      const navigationSitemap: SitemapField[] = canonicalUrls.map((url) => ({
        loc: `${serverURL}${url}`,
        lastmod: dateFallback,
        changefreq: url.includes('blog') || url.includes('observations') ? 'daily' : 'weekly',
      }))

      // Create sitemap entries for pages, excluding those that are canonical in navigation
      const pagesSitemap: SitemapField[] = pagesRes.docs
        ? pagesRes.docs
            .filter((page) => Boolean(page?.slug) && !excludedSlugs.includes(page.slug))
            .map((page) => {
              return {
                loc: `${serverURL}/${page?.slug}`,
                lastmod: page.updatedAt || dateFallback,
                changefreq: 'monthly',
              }
            })
        : []

      // Enhance navigation sitemap with lastmod from matching pages
      const enhancedNavigationSitemap = navigationSitemap.map((navItem) => {
        const url = navItem.loc.replace(serverURL, '')
        const matchingPageSlug = url.split('/').filter(Boolean).pop()
        const matchingPage = pagesRes.docs?.find((page) => page.slug === matchingPageSlug)

        return {
          ...navItem,
          lastmod: matchingPage?.updatedAt || navItem.lastmod,
        }
      })

      const combinedSitemap: SitemapField[] = [...enhancedNavigationSitemap, ...pagesSitemap]

      return combinedSitemap.sort((a, b) => a.loc.localeCompare(b.loc))
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
