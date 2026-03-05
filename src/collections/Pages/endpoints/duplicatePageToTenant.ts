'use server'

import { removeIdKey } from '@/utilities/removeIdKey'
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
