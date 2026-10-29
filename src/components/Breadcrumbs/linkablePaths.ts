import { extractAllInternalUrls, getCachedTopLevelNavItems } from '@/components/Header/utils'
import { normalizePath } from '@/utilities/path'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

// A center's built-in pages are the native routes it has (blog, events, zones, archives), whether
// or not its nav links them. They're edited only by super admins, so an hourly refresh is plenty.
const getCachedBuiltInPageUrls = (center: string) =>
  unstable_cache(
    async () => {
      const payload = await getPayload({ config: configPromise })
      const { docs } = await payload.find({
        collection: 'builtInPages',
        depth: 0,
        pagination: false,
        select: { url: true },
        where: { 'tenant.slug': { equals: center } },
      })
      return docs.map((doc) => normalizePath(doc.url, { ensureLeadingSlash: true }))
    },
    [`built-in-page-urls-${center}`],
    { tags: [`navigation-${center}`], revalidate: 3600 },
  )

const navUrls = async (center: string) => {
  const { topLevelNavItems } = await getCachedTopLevelNavItems(center)()
  return extractAllInternalUrls(topLevelNavItems)
}

/**
 * Paths a breadcrumb may link to: what the center's nav links, plus its built-in pages. Nav
 * sections and dropdown tabs have neither, so they never link. If one source can't be read, the
 * other still counts.
 */
export async function linkablePaths(center: string): Promise<string[]> {
  const results = await Promise.allSettled([navUrls(center), getCachedBuiltInPageUrls(center)()])
  const failures = results.flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : [],
  )
  if (failures.length > 0) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error({ err: failures[0] }, `Breadcrumbs for ${center} missing some links`)
  }
  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
}
