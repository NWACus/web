import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import { BaseFilter } from 'payload'

// filterByTenant implements per-tenant data filtering from the 'payload-tenant' cookie
// by setting the base list filters that users can add to but not remove from. Access
// control defines the set of data to be filtered, so this filter is on-top and has no
// risk of letting users see data they cannot access.
export const filterByTenant: BaseFilter = async ({ req }) => {
  const tenantSlug = getTenantSlugFromCookie(req.headers)

  if (tenantSlug) {
    return {
      'tenant.slug': {
        equals: tenantSlug,
      },
    }
  }

  return null
}
