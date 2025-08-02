import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

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
      const preRewritePath = `/${doc.slug}`
      const postRewritePath = `/${tenant.slug}${preRewritePath}`

      payload.logger.info(`Revalidating page at paths: ${preRewritePath}, ${postRewritePath}`)

      revalidatePath(preRewritePath)
      revalidatePath(postRewritePath)
      revalidateTag(`pages-sitemap-${tenant.slug}`)
    }

    // If the page was previously published, and it is no longer published or the slug has changed
    // we need to revalidate the old path
    if (
      previousDoc._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)
    ) {
      const oldPreRewritePath = `/${previousDoc.slug}`
      const oldPostRewritePath = `/${tenant.slug}${oldPreRewritePath}`

      payload.logger.info(
        `Revalidating old page at paths: ${oldPreRewritePath}, ${oldPostRewritePath}`,
      )

      revalidatePath(oldPreRewritePath)
      revalidatePath(oldPostRewritePath)
      revalidateTag(`pages-sitemap-${tenant.slug}`)
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

    const preRewritePath = `/${doc.slug}`
    const postRewritePath = `/${tenant.slug}${preRewritePath}`

    payload.logger.info(`Revalidating deleted page at paths: ${preRewritePath}, ${postRewritePath}`)

    revalidatePath(preRewritePath)
    revalidatePath(postRewritePath)
    revalidateTag(`pages-sitemap-${tenant.slug}`)
  }

  return doc
}
