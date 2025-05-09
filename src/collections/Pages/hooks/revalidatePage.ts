import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '@/payload-types'

export const revalidatePage: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      let tenantSlug = ''
      if (typeof doc.tenant === 'object') {
        tenantSlug = doc.tenant.slug
      } else {
        const tenant = await payload.findByID({
          id: doc.tenant,
          collection: 'tenants',
          depth: 0,
        })
        tenantSlug = tenant.slug
      }
      const path = `/${tenantSlug}` + (doc.slug === 'home' ? '/' : `/${doc.slug}`)

      payload.logger.info(`Revalidating page at path: ${path}`)

      revalidatePath(path)
      revalidateTag('pages-sitemap')
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      let tenantSlug = ''
      if (typeof previousDoc.tenant === 'object') {
        tenantSlug = previousDoc.tenant.slug
      } else {
        const tenant = await payload.findByID({
          id: previousDoc.tenant,
          collection: 'tenants',
          depth: 0,
        })
        tenantSlug = tenant.slug
      }
      const oldPath =
        `/${tenantSlug}` + (previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`)

      payload.logger.info(`Revalidating old page at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateTag('pages-sitemap')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`
    revalidatePath(path)
    revalidateTag('pages-sitemap')
  }

  return doc
}
