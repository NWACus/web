import { getURL } from '../getURL'
import { PRODUCTION_TENANTS, TENANTS } from './tenants'

export function getProductionTenantUrls() {
  const productionTenantDefs = TENANTS.filter((tenant) => PRODUCTION_TENANTS.includes(tenant.slug))
  return productionTenantDefs.map(({ customDomain }) => getURL(customDomain))
}
