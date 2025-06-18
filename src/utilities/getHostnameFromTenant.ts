import { Tenant } from '@/payload-types'
import { ROOT_DOMAIN } from './domain'

export function getHostnameFromTenant(tenant: Tenant | null) {
  if (!tenant) return ROOT_DOMAIN

  if (tenant.useCustomDomain) {
    return tenant.customDomain
  }

  return `${tenant.slug}.${ROOT_DOMAIN}`
}
