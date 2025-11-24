'use server'

import configPromise from '@payload-config'
import { getPayload, PayloadRequest } from 'payload'

export async function duplicatePageToTenant(req: PayloadRequest) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const selectedTenantId = req.routeParams?.selectedTenantId as number

  const { newPage } = await req.json?.()

  const indexedPageResult = await getIndexedTitleAndSlug(
    newPage.slug,
    newPage.title,
    selectedTenantId,
  )

  const payload = await getPayload({ config: configPromise })
  const tenant = await payload
    .find({ collection: 'tenants', where: { id: { equals: selectedTenantId } } })
    .then((res) => res.docs[0])

  const newPageSansIds = removeIdKey(newPage)

  return await payload.create({
    collection: 'pages',
    data: {
      ...newPageSansIds,
      tenant,
      title: indexedPageResult.title,
      slug: indexedPageResult.slug,
    },
  })
}

async function getIndexedTitleAndSlug(
  baseSlug: string,
  baseTitle: string,
  tenantId: number,
  i = 1,
): Promise<{ slug: string; title: string }> {
  const slug = i === 1 ? baseSlug : `${baseSlug}-${i}`

  const payload = await getPayload({ config: configPromise })
  const pageResults = await payload.find({
    collection: 'pages',
    depth: 0,
    where: {
      slug: {
        equals: slug,
      },
      tenant: {
        equals: tenantId,
      },
    },
  })
  if (pageResults.totalDocs < 1) {
    return { slug, title: `${baseTitle} ${i}` }
  }
  return getIndexedTitleAndSlug(baseSlug, baseTitle, tenantId, i + 1)
}

const removeIdKey = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return obj.map(removeIdKey) as T
  }
  if (obj && typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([k]) => !k.toLowerCase().includes('id'))
        .map(([k, v]) => [k, removeIdKey(v)]),
    ) as T
  }
  return obj
}
