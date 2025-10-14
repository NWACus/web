'use server'
import config from '@payload-config'
import { getPayload } from 'payload'

export async function getSlugFromTenantId(id: number) {
  const payload = await getPayload({ config })
  const tenant = await payload.findByID({
    collection: 'tenants',
    id: id,
    select: {
      id: true,
      slug: true,
    },
  })

  return tenant.slug
}
