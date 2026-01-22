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

/**
 * @deprecated Use getTenantSlugFromCookie instead. The cookie now stores slugs, not IDs.
 * This function remains for backwards compatibility during migration.
 */
export function getTenantFromCookie(headers: Headers, idType: 'number'): number | null
export function getTenantFromCookie(headers: Headers, idType: 'text'): string | null
export function getTenantFromCookie(
  headers: Headers,
  idType: 'number' | 'text',
): number | string | null
export function getTenantFromCookie(
  headers: Headers,
  _idType: 'number' | 'text',
): number | string | null {
  // Cookie now stores slug strings, so numeric lookups will return null
  // Use getTenantSlugFromCookie instead
  const slug = getTenantSlugFromCookie(headers)
  return slug
}
