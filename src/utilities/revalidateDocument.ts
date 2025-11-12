import { getCachedTopLevelNavItems, getNavigationPathForSlug } from '@/components/Header/utils'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

export interface RevalidationReference {
  collection:
    | 'biographies'
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
  collection: 'pages' | 'posts' | 'homePages' | 'events'
  id: number
  slug: string
  tenant: number | { id: number; slug: string }
}

export async function revalidateDocument(doc: DocumentForRevalidation): Promise<void> {
  const payload = await getPayload({ config: configPromise })
  let tenant = doc.tenant

  if (typeof tenant === 'number') {
    try {
      tenant = await payload.findByID({
        collection: 'tenants',
        id: tenant,
        depth: 0,
      })
    } catch (error) {
      payload.logger.warn(
        `Failed to resolve tenant ${tenant} for ${doc.collection} ${doc.id}: ${error}`,
      )
      return
    }
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
  }

  if (doc.collection === 'posts') {
    const basePaths = [`/blog/${doc.slug}`, `/${tenant.slug}/blog/${doc.slug}`]

    payload.logger.info(
      `Revalidating ${doc.collection} ${doc.slug} at paths: ${basePaths.join(', ')}`,
    )

    basePaths.forEach((path) => revalidatePath(path))
  }

  if (doc.collection === 'homePages') {
    const basePaths = [`/`, `/${tenant.slug}`]

    payload.logger.info(
      `Revalidating ${doc.collection} for tenant ${tenant.slug} at paths: ${basePaths.join(', ')}`,
    )

    basePaths.forEach((path) => revalidatePath(path))
  }

  if (doc.collection === 'events') {
    const basePaths = [`/events/${doc.slug}`, `/${tenant.slug}/events/${doc.slug}`]

    payload.logger.info(
      `Revalidating ${doc.collection} ${doc.slug} at paths: ${basePaths.join(', ')}`,
    )

    basePaths.forEach((path) => revalidatePath(path))
  }
}
