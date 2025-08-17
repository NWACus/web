import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Tenant } from '@/payload-types'
import { SelectFromCollectionSlug } from 'node_modules/payload/dist/collections/config/types'
import { getTenantIdFromCookie } from './getTenantIdFromCookie'

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
  const tenantIdFromCookie = getTenantIdFromCookie(headers)
  if (!tenantIdFromCookie) {
    return null
  }

  return resolveTenant(tenantIdFromCookie, options)
}
