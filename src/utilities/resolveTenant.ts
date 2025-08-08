import type { Payload } from 'payload'

import type { Tenant } from '@/payload-types'

export const resolveTenant = async (tenant: number | Tenant, payload: Payload): Promise<Tenant> => {
  if (typeof tenant === 'number') {
    return await payload.findByID({
      collection: 'tenants',
      id: tenant,
      depth: 0,
    })
  }
  return tenant
}
