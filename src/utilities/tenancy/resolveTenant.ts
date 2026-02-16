import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Tenant } from '@/payload-types'
import { SelectFromCollectionSlug } from 'node_modules/payload/dist/collections/config/types'
import { getTenantSlugFromCookie } from './getTenantFromCookie'

export const resolveTenant = async (
  tenant: number | Tenant,
  options?: { select: SelectFromCollectionSlug<'tenants'> },
): Promise<Tenant> => {
  if (typeof tenant === 'number') {
    const payload = await getPayload({ config: configPromise })
    return await payload.findByID({
      collection: 'tenants',
      id: tenant,
      depth: 0,
      select: options?.select ?? undefined,
    })
  }
  return tenant
}

export const resolveTenantFromCookie = async (
  headers: Headers,
  options?: { select: SelectFromCollectionSlug<'tenants'> },
): Promise<Tenant | null> => {
  const tenantSlug = getTenantSlugFromCookie(headers)
  if (!tenantSlug) {
    return null
  }

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'tenants',
    where: {
      slug: { equals: tenantSlug },
    },
    limit: 1,
    depth: 0,
    select: options?.select ?? undefined,
  })

  return docs[0] || null
}
