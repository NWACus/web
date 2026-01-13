'use server'

import configPromise from '@payload-config'
import { getPayload, PayloadRequest } from 'payload'

export async function duplicatePageToTenant(req: PayloadRequest) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const selectedTenantId = req.routeParams?.selectedTenantId as number

  const { newPage } = await req.json?.()

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
      title: `${newPage.title} - Copy`,
      slug: `${newPage.slug}-copy`,
    },
  })
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
