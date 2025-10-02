import { getTenantFromCookie } from '@/plugins/multiTenant/getTenantFromCookie'

// Light wrapper around the multi tenant plugin's getTenantFromCookie that enforces the id type as number
// which is how we store our tenant identifier in the payload-tenant cookie
export function getTenantIdFromCookie(headers: Headers): number | null {
  const tenantCookieVal = getTenantFromCookie(headers, 'number')

  if (typeof tenantCookieVal === 'string') {
    return !!tenantCookieVal ? Number(tenantCookieVal) : null
  }

  return tenantCookieVal
}
