'use server'

import { clearLayoutRelationships } from '@/utilities/clearLayoutRelationships'
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

  const newPageSansRefs = clearLayoutRelationships(newPage.layout ?? [])

  return await payload.create({
    collection: 'pages',
    draft: true,
    data: {
      ...newPageSansRefs,
      tenant,
      title: `${newPage.title} - Copy`,
      slug: `${newPage.slug}-copy`,
    },
  })
}
