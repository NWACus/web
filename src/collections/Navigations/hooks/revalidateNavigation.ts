import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { extractAllInternalUrls, getCachedTopLevelNavItems } from '@/components/Header/utils'
import { revalidatePath, revalidateTag } from 'next/cache'

import type { Navigation } from '@/payload-types'

export const revalidateNavigation: CollectionAfterChangeHook<Navigation> = async ({
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

    payload.logger.info(`Revalidating navigation cache for tenant: ${tenant.slug}`)

    // Invalidate navigation cache tags first
    revalidateTag(`navigation-${tenant.slug}`)
    revalidateTag(`pages-sitemap-${tenant.slug}`)

    try {
      // Get current and previous navigation URLs to find what changed
      const currentNavItems = await getCachedTopLevelNavItems(tenant.slug)(tenant.slug)
      const currentUrls = extractAllInternalUrls(currentNavItems)

      // Revalidate all current navigation paths
      currentUrls.forEach((url) => {
        revalidatePath(`/${tenant.slug}${url}`)

        // Also revalidate the root slug path in case it redirects to this navigation path
        const slug = url.split('/').filter(Boolean).pop()
        if (slug) {
          revalidatePath(`/${tenant.slug}/${slug}`)
        }
      })

      // If there was a previous version, also revalidate paths that might have been removed
      if (previousDoc) {
        // Note: We can't easily get the previous navigation structure since the cache is invalidated
        // But the page revalidation hooks will handle individual page changes
        payload.logger.info(
          `Navigation updated - revalidated ${currentUrls.length} navigation paths`,
        )
      }
    } catch (error) {
      payload.logger.warn(`Failed to revalidate navigation paths: ${error}`)
    }
  }
  return doc
}

export const revalidateNavigationDelete: CollectionAfterDeleteHook<Navigation> = async ({
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

    payload.logger.info(`Revalidating navigation cache for deleted tenant: ${tenant.slug}`)

    revalidateTag(`navigation-${tenant.slug}`)
    revalidateTag(`pages-sitemap-${tenant.slug}`)
  }

  return doc
}
