import { getURL } from '../getURL'
import { getTenants } from './getTenants'
import { PRODUCTION_TENANTS } from './tenants'

export async function getProductionTenantUrls() {
  const tenants = await getTenants()
  const productionTenantDefs = tenants.filter((tenant) => PRODUCTION_TENANTS.includes(tenant.slug))
  return productionTenantDefs.map(({ customDomain }) => getURL(customDomain))
}
