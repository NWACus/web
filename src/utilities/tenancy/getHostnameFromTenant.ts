import { Tenant } from '@/payload-types'
import { ROOT_DOMAIN } from '../domain'
import { getProductionTenantSlugs } from './getProductionTenants'

export function getHostnameFromTenant(tenant: Tenant | null) {
  console.log('tenant in getHostnameFromTenant: ', JSON.stringify(tenant))
  console.log('ROOT_DOMAIN in getHostnameFromTenant: ', ROOT_DOMAIN)

  if (!tenant) return ROOT_DOMAIN

  if (getProductionTenantSlugs().includes(tenant.slug)) {
    return tenant.customDomain
  }

  return `${tenant.slug}.${ROOT_DOMAIN}`
}
