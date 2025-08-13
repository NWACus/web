import type { Payload } from 'payload'

import type { Tenant } from '@/payload-types'
import { SelectFromCollectionSlug } from 'node_modules/payload/dist/collections/config/types'

export const resolveTenant = async (
  tenant: number | Tenant,
  payload: Payload,
  options?: { select: SelectFromCollectionSlug<'tenants'> },
): Promise<Tenant> => {
  if (typeof tenant === 'number') {
    return await payload.findByID({
      collection: 'tenants',
      id: tenant,
      depth: 0,
      select: options?.select ?? undefined,
    })
  }
  return tenant
}
