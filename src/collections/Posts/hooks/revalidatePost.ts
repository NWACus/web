import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '@/payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
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
        depth: 2,
      })
    }

    if (doc._status === 'published') {
      const path = `/${tenant.slug}/blog/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePath(path)
      revalidateTag(`posts-sitemap-${tenant.slug}`)
    }

    // If the post was previously published, and it is no longer published or the slug has changed
    // we need to revalidate the old path
    if (
      previousDoc._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)
    ) {
      const oldPath = `/${tenant.slug}/blog/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateTag(`posts-sitemap-${tenant.slug}`)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    let tenant = doc.tenant

    if (typeof tenant === 'number') {
      tenant = await payload.findByID({
        collection: 'tenants',
        id: tenant,
        depth: 2,
      })
    }

    const path = `/${tenant.slug}/blog/${doc?.slug}`

    payload.logger.info(`Revalidating deleted post at path: ${path}`)

    revalidatePath(path)
    revalidateTag(`posts-sitemap-${tenant.slug}`)
  }

  return doc
}
