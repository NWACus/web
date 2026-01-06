import type { BasePayload, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

const revalidate = async ({
  docId,
  slug,
  tenantSlug,
  payload,
}: {
  docId: number
  slug: string
  tenantSlug: string
  payload: BasePayload
}) => {
  const preRewritePath = `/blog/${slug}`
  const postRewritePath = `/${tenantSlug}${preRewritePath}`

  payload.logger.info(`Revalidating paths: ${[preRewritePath, postRewritePath].join(', ')}`)

  revalidatePath(preRewritePath)
  revalidatePath(postRewritePath)
  revalidateTag(`posts-sitemap-${tenantSlug}`)
  revalidateTag(`navigation-${tenantSlug}`)

  await revalidateBlockReferences({
    collection: 'posts',
    id: docId,
  })

  await revalidateRelationshipReferences({
    collection: 'posts',
    id: docId,
  })
}

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant)

  if (doc._status === 'published') {
    revalidate({ docId: doc.id, slug: doc.slug, tenantSlug: tenant.slug, payload })
  }

  // If the post was previously published, and it is no longer published or the slug has changed
  // we need to revalidate the old path
  if (
    previousDoc._status === 'published' &&
    (doc._status !== 'published' || previousDoc.slug !== doc.slug)
  ) {
    payload.logger.info('Revalidating old post')
    revalidate({ docId: doc.id, slug: previousDoc.slug, tenantSlug: tenant.slug, payload })
  }
}

export const revalidatePostDelete: CollectionAfterDeleteHook<Post> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  const tenant = await resolveTenant(doc.tenant)

  revalidate({ docId: doc.id, slug: doc.slug, tenantSlug: tenant.slug, payload })
}
