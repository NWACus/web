import { Tenant } from '@/payload-types'
import { ROOT_DOMAIN } from '../domain'
import { getProductionTenantSlugs } from './getProductionTenants'

export function getHostnameFromTenant(tenant: Tenant | null) {
  if (!tenant) return ROOT_DOMAIN

  if (getProductionTenantSlugs().includes(tenant.slug)) {
    return tenant.customDomain
  }

  return `${tenant.slug}.${ROOT_DOMAIN}`
}
