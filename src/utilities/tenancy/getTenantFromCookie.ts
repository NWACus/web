import { parseCookies } from 'payload'
import { isNumber } from 'payload/shared'

/**
 * A function that takes request headers and an idType and returns the current tenant ID from the cookie
 *
 * @param headers Headers, usually derived from req.headers or next/headers
 * @param idType can be 'number' | 'text', usually derived from payload.db.defaultIDType
 * @returns number | null when idType is 'number', string | null when idType is 'text'
 */
export function getTenantFromCookie(headers: Headers, idType: 'number'): number | null
export function getTenantFromCookie(headers: Headers, idType: 'text'): string | null
export function getTenantFromCookie(
  headers: Headers,
  idType: 'number' | 'text',
): number | string | null
export function getTenantFromCookie(
  headers: Headers,
  idType: 'number' | 'text',
): number | string | null {
  const cookies = parseCookies(headers)
  const selectedTenant = cookies.get('payload-tenant') || null
  const result = selectedTenant
    ? idType === 'number' && isNumber(selectedTenant)
      ? parseFloat(selectedTenant)
      : selectedTenant
    : null
  return result
}
