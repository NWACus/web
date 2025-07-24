import { STATIC_TENANTS } from '@/generated/tenants'
import { getURL } from '../getURL'
import { PRODUCTION_TENANTS } from './tenants'

export function getProductionTenantUrls() {
  const productionTenantDefs = STATIC_TENANTS.filter((tenant) =>
    PRODUCTION_TENANTS.includes(tenant.slug),
  )
  return productionTenantDefs.map(({ customDomain }) => getURL(customDomain))
}
