import { Tenant } from '@/payload-types'
import { ROOT_DOMAIN } from '../domain'
import { AVALANCHE_CENTERS, isValidTenantSlug } from './avalancheCenters'
import { isProductionTenant } from './tenants'

export function getHostnameFromTenant(tenant: Tenant | null) {
  if (!tenant) return ROOT_DOMAIN

  if (isProductionTenant(tenant.slug) && isValidTenantSlug(tenant.slug)) {
    return AVALANCHE_CENTERS[tenant.slug].customDomain
  }

  return `${tenant.slug}.${ROOT_DOMAIN}`
}
