import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { extractAllInternalUrls, getCachedTopLevelNavItems } from '@/components/Header/utils'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { revalidatePath, revalidateTag } from 'next/cache'

import type { Navigation } from '@/payload-types'

export const revalidateNavigation: CollectionAfterChangeHook<Navigation> = async ({
  doc,
  req: { payload, context, query },
}) => {
  if (context.disableRevalidate) return

  if (query && query.autosave === 'true') return

  if (doc._status === 'published') {
    const tenant = await resolveTenant(doc.tenant)

    payload.logger.info(`Revalidating navigation cache for tenant: ${tenant.slug}`)

    // Invalidate navigation cache tags first
    revalidateTag(`navigation-${tenant.slug}`)
    revalidateTag(`pages-sitemap-${tenant.slug}`)

    try {
      // Get current and previous navigation URLs to find what changed
      const { topLevelNavItems } = await getCachedTopLevelNavItems(tenant.slug)()
      const currentUrls = extractAllInternalUrls(topLevelNavItems)

      // Revalidate all current navigation paths
      currentUrls.forEach((url) => {
        revalidatePath(`/${tenant.slug}${url}`)

        // Also revalidate the root slug path in case it redirects to this navigation path
        const slug = url.split('/').filter(Boolean).pop()
        if (slug) {
          revalidatePath(`/${tenant.slug}/${slug}`)
        }
      })

      payload.logger.info(`Navigation updated - revalidated ${currentUrls.length} navigation paths`)
    } catch (error) {
      payload.logger.warn(`Failed to revalidate navigation paths: ${error}`)
    }
  }
}

export const revalidateNavigationDelete: CollectionAfterDeleteHook<Navigation> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant)

  payload.logger.info(`Revalidating navigation cache for deleted tenant: ${tenant.slug}`)

  revalidateTag(`navigation-${tenant.slug}`)
  revalidateTag(`pages-sitemap-${tenant.slug}`)
}
