import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities'
import { BaseListFilter } from 'payload'

// filterByTenant implements per-tenant data filtering from the 'payload-tenant' cookie
// by setting the base list filters that users can add to but not remove from. Access
// control defines the set of data to be filtered, so this filter is on-top and has no
// risk of letting users see data they cannot access.
export const filterByTenant: BaseListFilter = async ({ req }) => {
  const selectedTenant = getTenantFromCookie(req.headers, 'number')

  if (selectedTenant) {
    return {
      tenants: {
        equals: selectedTenant,
      },
    }
  }

  return null
}
