import {
  getTenantIDFromCookie,
  getTenantSlugFromCookie,
} from '@/utilities/tenancy/getTenantFromCookie'
import { BaseFilter, Where } from 'payload'

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

// filterByTenantID is filterByTenant for folder-enabled collections. Payload's folder views load
// a folder's contents through a polymorphic join, which cannot query a related field such as
// 'tenant.slug', so these collections filter on the tenant ID instead.
export const filterByTenantID: BaseFilter = async ({ req }) => {
  const tenantSlug = getTenantSlugFromCookie(req.headers)

  if (!tenantSlug) {
    return null
  }

  const tenantID = await getTenantIDFromCookie(req)
  const where: Where =
    tenantID === null ? { 'tenant.slug': { equals: tenantSlug } } : { tenant: { equals: tenantID } }

  return where
}
