import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload'

import { getCachedTopLevelNavItems, getNavigationPathForSlug } from '@/components/Header/utils'
import { resolveTenant } from '@/utilities/resolveTenant'
import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '@/payload-types'
import { normalizePath } from '@/utilities/path'

const revalidatePagePaths = async ({
  slug,
  tenantSlug,
  payload,
  logPrefix = 'Revalidating page',
}: {
  slug: string
  tenantSlug: string
  payload: Payload
  logPrefix?: string
}) => {
  const basePaths = [`/${slug}`, `/${tenantSlug}/${slug}`]

  try {
    const { topLevelNavItems } = await getCachedTopLevelNavItems(tenantSlug)()
    const navigationPaths = getNavigationPathForSlug(topLevelNavItems, slug)

    const allPaths = [...basePaths, ...navigationPaths.map((path) => `/${tenantSlug}${path}`)]

    const uniquePaths = Array.from(new Set(allPaths)).map((path) =>
      normalizePath(path, { ensureLeadingSlash: true }),
    )

    payload.logger.info(`${logPrefix} at paths: ${uniquePaths.join(', ')}`)

    uniquePaths.forEach((path) => revalidatePath(path))
  } catch (error) {
    payload.logger.warn(
      `Failed to get navigation paths for slug ${slug}, falling back to basic paths: ${error}`,
    )

    basePaths.forEach((path) => revalidatePath(path))
  }
}

const revalidatePageTags = (tenantSlug: string) => {
  revalidateTag(`pages-sitemap-${tenantSlug}`)
  revalidateTag(`navigation-${tenantSlug}`)
}

export const revalidatePage: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant, payload)

  if (doc._status === 'published') {
    await revalidatePagePaths({
      slug: doc.slug,
      tenantSlug: tenant.slug,
      payload,
      logPrefix: 'Revalidating page',
    })

    revalidatePageTags(tenant.slug)
  }

  // If the page was previously published, and it is no longer published or the slug has changed
  // we need to revalidate the old path
  if (
    previousDoc._status === 'published' &&
    (doc._status !== 'published' || previousDoc.slug !== doc.slug)
  ) {
    await revalidatePagePaths({
      slug: previousDoc.slug,
      tenantSlug: tenant.slug,
      payload,
      logPrefix: 'Revalidating old page',
    })

    revalidatePageTags(tenant.slug)
  }
}

export const revalidatePageDelete: CollectionAfterDeleteHook<Page> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant, payload)

  await revalidatePagePaths({
    slug: doc.slug,
    tenantSlug: tenant.slug,
    payload,
    logPrefix: 'Revalidating deleted page',
  })

  revalidatePageTags(tenant.slug)
}
