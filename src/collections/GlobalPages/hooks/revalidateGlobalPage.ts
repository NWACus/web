import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { GlobalPage } from '@/payload-types'

const revalidateGlobalPagePaths = async ({
  slug,
  payload,
  logPrefix = 'Revalidating global page',
}: {
  slug: string
  payload: Parameters<CollectionAfterChangeHook>[0]['req']['payload']
  logPrefix?: string
}) => {
  // Fetch all tenants to revalidate across all sites
  const tenantsRes = await payload.find({
    collection: 'tenants',
    limit: 100,
    pagination: false,
    select: { slug: true },
  })

  const paths = [`/${slug}`]

  for (const tenant of tenantsRes.docs) {
    paths.push(`/${tenant.slug}/${slug}`)
    revalidateTag(`pages-sitemap-${tenant.slug}`)
    revalidateTag(`navigation-${tenant.slug}`)
  }

  payload.logger.info(`${logPrefix} at paths: ${paths.join(', ')}`)

  paths.forEach((path) => revalidatePath(path))
}

export const revalidateGlobalPage: CollectionAfterChangeHook<GlobalPage> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  if (doc._status === 'published') {
    await revalidateGlobalPagePaths({
      slug: doc.slug,
      payload,
      logPrefix: 'Revalidating global page',
    })
  }

  if (
    previousDoc._status === 'published' &&
    (doc._status !== 'published' || previousDoc.slug !== doc.slug)
  ) {
    await revalidateGlobalPagePaths({
      slug: previousDoc.slug,
      payload,
      logPrefix: 'Revalidating old global page',
    })
  }
}

export const revalidateGlobalPageDelete: CollectionAfterDeleteHook<GlobalPage> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return

  await revalidateGlobalPagePaths({
    slug: doc.slug,
    payload,
    logPrefix: 'Revalidating deleted global page',
  })
}
