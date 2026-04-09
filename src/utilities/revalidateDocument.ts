import { getCachedTopLevelNavItems, getNavigationPathForSlug } from '@/components/Header/utils'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

import type { Tenant } from '@/payload-types'
import { resolveTenant } from './tenancy/resolveTenant'

export interface RevalidationReference {
  collection:
    | 'biographies'
    | 'documents'
    | 'teams'
    | 'media'
    | 'forms'
    | 'tags'
    | 'posts'
    | 'homePages'
    | 'sponsors'
    | 'events'
  id: number
}

export interface DocumentForRevalidation {
  collection: string
  id: number
  slug: string
  tenant: number | Tenant
}

export async function revalidateDocument(doc: DocumentForRevalidation): Promise<void> {
  const payload = await getPayload({ config: configPromise })

  let tenant: Tenant
  try {
    tenant = await resolveTenant(doc.tenant)
  } catch (error) {
    payload.logger.warn(`Failed to resolve tenant for ${doc.collection} ${doc.id}: ${error}`)
    return
  }

  if (doc.collection === 'pages') {
    const basePaths = [`/${doc.slug}`, `/${tenant.slug}/${doc.slug}`]

    try {
      const { topLevelNavItems } = await getCachedTopLevelNavItems(tenant.slug)()
      const navigationPaths = getNavigationPathForSlug(topLevelNavItems, doc.slug)

      const allPaths = [
        ...basePaths,
        ...navigationPaths.flatMap((path) => [path, `/${tenant.slug}${path}`]),
      ]

      payload.logger.info(
        `Revalidating ${doc.collection} ${doc.slug} at paths: ${allPaths.join(', ')}`,
      )

      allPaths.forEach((path) => revalidatePath(path))
    } catch (error) {
      payload.logger.warn(
        `Failed to get navigation paths for ${doc.collection} ${doc.slug}, falling back to basic paths: ${error}`,
      )

      basePaths.forEach((path) => revalidatePath(path))
    }
    return
  }

  if (doc.collection === 'posts') {
    const basePaths = [`/blog/${doc.slug}`, `/${tenant.slug}/blog/${doc.slug}`]

    payload.logger.info(
      `Revalidating ${doc.collection} ${doc.slug} at paths: ${basePaths.join(', ')}`,
    )

    basePaths.forEach((path) => revalidatePath(path))
    return
  }

  if (doc.collection === 'homePages') {
    const basePaths = [`/`, `/${tenant.slug}`]

    payload.logger.info(
      `Revalidating ${doc.collection} for tenant ${tenant.slug} at paths: ${basePaths.join(', ')}`,
    )

    basePaths.forEach((path) => revalidatePath(path))
    return
  }

  if (doc.collection === 'events') {
    const basePaths = [`/events/${doc.slug}`, `/${tenant.slug}/events/${doc.slug}`]

    payload.logger.info(
      `Revalidating ${doc.collection} ${doc.slug} at paths: ${basePaths.join(', ')}`,
    )

    basePaths.forEach((path) => revalidatePath(path))
    return
  }

  payload.logger.warn(
    `revalidateDocument: no path mapping for collection '${doc.collection}' (doc ID ${doc.id}). Add a handler or check if documentReferencesField() should be removed from this collection.`,
  )
}
