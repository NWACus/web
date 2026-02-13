import { Tenant } from '@/payload-types'
import { ROOT_DOMAIN } from '../domain'
import { isProductionTenant } from './tenants'

export function getHostnameFromTenant(tenant: Tenant | null) {
  if (!tenant) return ROOT_DOMAIN

  if (isProductionTenant(tenant.slug) && tenant.customDomain) {
    return tenant.customDomain
  }

  return `${tenant.slug}.${ROOT_DOMAIN}`
}
