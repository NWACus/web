import { isValidTenantSlug, ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { parseCookies, type PayloadRequest } from 'payload'

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
 * Returns the ID of the tenant selected by the 'payload-tenant' cookie, or null when no tenant is
 * selected or the slug has no tenant document.
 */
export async function getTenantIDFromCookie(req: PayloadRequest): Promise<number | null> {
  const tenantSlug = getTenantSlugFromCookie(req.headers)
  if (!tenantSlug) {
    return null
  }

  const { docs } = await req.payload.find({
    collection: 'tenants',
    where: { slug: { equals: tenantSlug } },
    limit: 1,
    depth: 0,
    select: {},
    req,
  })

  return docs[0]?.id ?? null
}
