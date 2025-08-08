import type { BasePayload, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { resolveTenant } from '@/utilities/resolveTenant'
import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '@/payload-types'

const revalidatePostPaths = (slug: string, tenantSlug: string, payload: BasePayload) => {
  const preRewritePath = `/blog/${slug}`
  const postRewritePath = `/${tenantSlug}${preRewritePath}`

  payload.logger.info(`Revalidating paths: ${[preRewritePath, postRewritePath].join(', ')}`)

  revalidatePath(preRewritePath)
  revalidatePath(postRewritePath)
  revalidateTag(`posts-sitemap-${tenantSlug}`)
  revalidateTag(`navigation-${tenantSlug}`)
}

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const tenant = await resolveTenant(doc.tenant, payload)

    if (doc._status === 'published') {
      revalidatePostPaths(doc.slug, tenant.slug, payload)
    }

    // If the post was previously published, and it is no longer published or the slug has changed
    // we need to revalidate the old path
    if (
      previousDoc._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)
    ) {
      payload.logger.info('Revalidating old post')
      revalidatePostPaths(previousDoc.slug, tenant.slug, payload)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const tenant = await resolveTenant(doc.tenant, payload)

    revalidatePostPaths(doc.slug, tenant.slug, payload)
  }

  return doc
}
