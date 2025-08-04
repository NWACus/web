import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { getCachedTopLevelNavItems, getNavigationPathForSlug } from '@/components/Header/utils'
import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '@/payload-types'

export const revalidatePage: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    let tenant = doc.tenant

    if (typeof tenant === 'number') {
      tenant = await payload.findByID({
        collection: 'tenants',
        id: tenant,
        depth: 0,
      })
    }

    if (doc._status === 'published') {
      const basePaths = [`/${doc.slug}`, `/${tenant.slug}/${doc.slug}`]

      try {
        const { topLevelNavItems } = await getCachedTopLevelNavItems(tenant.slug)()
        const navigationPaths = getNavigationPathForSlug(topLevelNavItems, doc.slug)

        // Include both the direct paths and the navigation paths
        const allPaths = [...basePaths, ...navigationPaths.map((path) => `/${tenant.slug}${path}`)]

        // Also ensure we revalidate the root slug path (for redirects) and canonical paths
        if (navigationPaths.length > 0) {
          allPaths.push(`/${tenant.slug}/${doc.slug}`) // Root slug that might redirect
        }

        const uniquePaths = Array.from(new Set(allPaths))

        payload.logger.info(`Revalidating page at paths: ${uniquePaths.join(', ')}`)

        uniquePaths.forEach((path) => revalidatePath(path))
      } catch (error) {
        payload.logger.warn(
          `Failed to get navigation paths for slug ${doc.slug}, falling back to basic paths: ${error}`,
        )

        basePaths.forEach((path) => revalidatePath(path))
      }

      revalidateTag(`pages-sitemap-${tenant.slug}`)
      revalidateTag(`navigation-${tenant.slug}`) // Navigation links derive URLs from page slugs
    }

    // If the page was previously published, and it is no longer published or the slug has changed
    // we need to revalidate the old path
    if (
      previousDoc._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)
    ) {
      const oldBasePaths = [`/${previousDoc.slug}`, `/${tenant.slug}/${previousDoc.slug}`]

      try {
        const { topLevelNavItems } = await getCachedTopLevelNavItems(tenant.slug)()
        const oldNavigationPaths = getNavigationPathForSlug(topLevelNavItems, previousDoc.slug)

        const allOldPaths = [
          ...oldBasePaths,
          ...oldNavigationPaths.map((path) => `/${tenant.slug}${path}`),
        ]
        const uniqueOldPaths = Array.from(new Set(allOldPaths))

        payload.logger.info(`Revalidating old page at paths: ${uniqueOldPaths.join(', ')}`)

        uniqueOldPaths.forEach((path) => revalidatePath(path))
      } catch (error) {
        payload.logger.warn(
          `Failed to get navigation paths for old slug ${previousDoc.slug}, falling back to basic paths: ${error}`,
        )

        oldBasePaths.forEach((path) => revalidatePath(path))
      }

      revalidateTag(`pages-sitemap-${tenant.slug}`)
      revalidateTag(`navigation-${tenant.slug}`) // Navigation links derive URLs from page slugs
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    let tenant = doc.tenant

    if (typeof tenant === 'number') {
      tenant = await payload.findByID({
        collection: 'tenants',
        id: tenant,
        depth: 0,
      })
    }

    const basePaths = [`/${doc.slug}`, `/${tenant.slug}/${doc.slug}`]

    try {
      const { topLevelNavItems } = await getCachedTopLevelNavItems(tenant.slug)()
      const navigationPaths = getNavigationPathForSlug(topLevelNavItems, doc.slug)

      const allPaths = [
        ...basePaths,
        ...navigationPaths.flatMap((path) => [path, `/${tenant.slug}${path}`]),
      ]
      const uniquePaths = Array.from(new Set(allPaths))

      payload.logger.info(`Revalidating deleted page at paths: ${uniquePaths.join(', ')}`)

      uniquePaths.forEach((path) => revalidatePath(path))
    } catch (error) {
      payload.logger.warn(
        `Failed to get navigation paths for deleted slug ${doc.slug}, falling back to basic paths: ${error}`,
      )

      basePaths.forEach((path) => revalidatePath(path))
    }

    revalidateTag(`pages-sitemap-${tenant.slug}`)
    revalidateTag(`navigation-${tenant.slug}`) // Navigation links derive URLs from page slugs
  }

  return doc
}
