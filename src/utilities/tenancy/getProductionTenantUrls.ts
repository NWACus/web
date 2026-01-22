import { getURL } from '../getURL'
import { getTenants } from './getTenants'
import { isProductionTenant } from './tenants'

export async function getProductionTenantUrls() {
  const tenants = await getTenants()
  const productionTenantDefs = tenants.filter((tenant) => isProductionTenant(tenant.slug))
  return productionTenantDefs.map(({ customDomain }) => getURL(customDomain))
}
