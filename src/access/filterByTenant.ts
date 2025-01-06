import { BaseListFilter } from 'payload'
import { defaultTenantIdFromHeaders } from '@/utilities/tenancy/defaultTenantIdFromHeaders'

// filterByTenant implements per-tenant data filtering from the 'payload-tenant' cookie
// by setting the base list filters that users can add to but not remove from. Access
// control defines the set of data to be filtered, so this filter is on-top and has no
// risk of letting users see data they cannot access.
export const filterByTenant: BaseListFilter = async ({ req: { headers, payload } }) => {
  const defaultTenantId = await defaultTenantIdFromHeaders(headers, payload)
  if (defaultTenantId) {
    return {
      tenant: {
        equals: defaultTenantId,
      },
    }
  }

  return null
}
