import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload'

import { getCachedTopLevelNavItems, getNavigationPathForSlug } from '@/components/Header/utils'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '@/payload-types'
import { normalizePath } from '@/utilities/path'
import { revalidateDocumentReferences } from '@/utilities/revalidateDocumentReferences'

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

const revalidate = async ({
  docId,
  slug,
  tenantSlug,
  payload,
  logPrefix = 'Revalidating page',
}: {
  docId: number
  slug: string
  tenantSlug: string
  payload: Payload
  logPrefix?: string
}) => {
  await revalidatePagePaths({ slug, tenantSlug, payload, logPrefix })

  revalidateTag(`pages-sitemap-${tenantSlug}`, 'default')
  revalidateTag(`navigation-${tenantSlug}`, 'default')

  await revalidateDocumentReferences({ collection: 'pages', id: docId })
}

export const revalidatePage: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant)

  if (doc._status === 'published') {
    await revalidate({
      docId: doc.id,
      slug: doc.slug,
      tenantSlug: tenant.slug,
      payload,
    })
  }

  // If the page was previously published, and it is no longer published or the slug has changed
  // we need to revalidate the old path
  if (
    previousDoc._status === 'published' &&
    (doc._status !== 'published' || previousDoc.slug !== doc.slug)
  ) {
    await revalidate({
      docId: doc.id,
      slug: previousDoc.slug,
      tenantSlug: tenant.slug,
      payload,
      logPrefix: 'Revalidating old page',
    })
  }
}

export const revalidatePageDelete: CollectionAfterDeleteHook<Page> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant)

  await revalidate({
    docId: doc.id,
    slug: doc.slug,
    tenantSlug: tenant.slug,
    payload,
    logPrefix: 'Revalidating deleted page',
  })
}
