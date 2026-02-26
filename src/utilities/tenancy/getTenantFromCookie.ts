import { isValidTenantSlug, ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { parseCookies } from 'payload'

/**
 * Returns the tenant slug from the 'payload-tenant' cookie.
 * The cookie stores a tenant slug string (e.g., 'nwac', 'sac').
 */
export function getTenantSlugFromCookie(headers: Headers): ValidTenantSlug | null {
  const cookies = parseCookies(headers)
  const selectedTenant = cookies.get('payload-tenant') || null

  if (selectedTenant && isValidTenantSlug(selectedTenant)) {
    return selectedTenant
  }

  return null
}
