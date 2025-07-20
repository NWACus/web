'use server'

import configPromise from '@payload-config'
import { getPayload, PayloadRequest } from 'payload'

export async function duplicatePageToTenant(req: PayloadRequest) {
  const selectedTenantId = req.routeParams?.selectedTenantId as number

  const { newPage } = await req.json?.()
  const newPageSansIds = removeIdKey(newPage)

  const slugIndex = await getUniqueSlug(newPageSansIds.slug, selectedTenantId)

  const payload = await getPayload({ config: configPromise })
  const tenant = await payload
    .find({ collection: 'tenants', where: { id: { equals: selectedTenantId } } })
    .then((res) => res.docs[0])

  return await payload.create({
    collection: 'pages',
    data: {
      ...newPageSansIds,
      tenant,
      title: `${newPage.title} ${slugIndex}`,
      slug: `${newPage.slug}-${slugIndex}`,
    },
  })
}

async function getUniqueSlug(baseSlug: string, tenantId: number, i = 1): Promise<string> {
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
    return `${i}`
  }
  return getUniqueSlug(baseSlug, tenantId, i + 1)
}

const removeIdKey = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map(removeIdKey) as T
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([k]) => !k.toLowerCase().includes('id'))
        .map(([k, v]) => [k, removeIdKey(v)]),
    ) as T
  }
  return obj
}
