import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '@/payload-types'
import { revalidateBlockReferences } from '@/utilities/revalidateBlockReferences'
import { revalidateRelationshipReferences } from '@/utilities/revalidateRelationshipReferences'

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  let tenant = doc.tenant

  if (typeof tenant === 'number') {
    tenant = await payload.findByID({
      collection: 'tenants',
      id: tenant,
      depth: 0,
    })
  }

  if (doc._status === 'published') {
    const preRewritePath = `/blog/${doc.slug}`
    const postRewritePath = `/${tenant.slug}${preRewritePath}`

    payload.logger.info(`Revalidating post at paths: ${preRewritePath}, ${postRewritePath}`)

    revalidatePath(preRewritePath)
    revalidatePath(postRewritePath)
    revalidateTag(`posts-sitemap-${tenant.slug}`)
  }

  // If the post was previously published, and it is no longer published or the slug has changed
  // we need to revalidate the old path
  if (
    previousDoc._status === 'published' &&
    (doc._status !== 'published' || previousDoc.slug !== doc.slug)
  ) {
    const oldPreRewritePath = `/blog/${previousDoc.slug}`
    const oldPostRewritePath = `/${tenant.slug}${oldPreRewritePath}`

    payload.logger.info(
      `Revalidating old post at paths: ${oldPreRewritePath}, ${oldPostRewritePath}`,
    )

    revalidatePath(oldPreRewritePath)
    revalidatePath(oldPostRewritePath)
    revalidateTag(`posts-sitemap-${tenant.slug}`)
    revalidateTag(`navigation-${tenant.slug}`) // Navigation links can derive URLs from post slugs
  }

  await revalidateBlockReferences({
    collection: 'posts',
    id: doc.id,
  })

  await revalidateRelationshipReferences({
    collection: 'posts',
    id: doc.id,
  })
}

export const revalidatePostDelete: CollectionAfterDeleteHook<Post> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  let tenant = doc.tenant

  if (typeof tenant === 'number') {
    tenant = await payload.findByID({
      collection: 'tenants',
      id: tenant,
      depth: 0,
    })
  }

  const preRewritePath = `/blog/${doc?.slug}`
  const postRewritepath = `/${tenant.slug}${preRewritePath}`

  payload.logger.info(`Revalidating deleted post at paths: ${preRewritePath}, ${postRewritepath}`)

  revalidatePath(preRewritePath)
  revalidatePath(postRewritepath)
  revalidateTag(`posts-sitemap-${tenant.slug}`)
  revalidateTag(`navigation-${tenant.slug}`) // Navigation links can derive URLs from post slugs

  await revalidateBlockReferences({
    collection: 'posts',
    id: doc.id,
  })

  await revalidateRelationshipReferences({
    collection: 'posts',
    id: doc.id,
  })
}
