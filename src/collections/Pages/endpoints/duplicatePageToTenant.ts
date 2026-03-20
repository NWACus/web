'use server'

import { removeIdKey } from '@/utilities/removeIdKey'
import configPromise from '@payload-config'
import { getPayload, PayloadRequest } from 'payload'

export async function duplicatePageToTenant(req: PayloadRequest) {
  const tenantSlug = req.routeParams?.tenantSlug

  const { newPage } = await req.json?.()

  const payload = await getPayload({ config: configPromise })
  const tenant = await payload
    .find({ collection: 'tenants', where: { slug: { equals: tenantSlug } }, limit: 1 })
    .then((res) => res.docs[0])

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantSlug}`)
  }

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
