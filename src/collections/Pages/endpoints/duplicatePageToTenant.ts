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

  const layoutWithoutRefs = clearLayoutRelationships(newPage.layout ?? [])

  // Only append "-copy" to title/slug if a page with that slug already exists for this tenant
  let title = newPage.title
  let slug = newPage.slug
  const existing = await payload.find({
    collection: 'pages',
    where: { tenant: { equals: tenant.id }, slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) {
    title = `${title} - Copy`
    slug = `${slug}-copy`
  }

  return await payload.create({
    collection: 'pages',
    draft: true,
    data: {
      layout: layoutWithoutRefs,
      tenant,
      title,
      slug,
    },
  })
}
