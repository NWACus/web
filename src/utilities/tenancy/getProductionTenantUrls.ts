import { getAllTenantsFromEdgeConfig } from '@/services/vercel'
import { getURL } from '../getURL'
import { PRODUCTION_TENANTS } from './tenants'

export async function getProductionTenantUrls() {
  const tenants = await getAllTenantsFromEdgeConfig()
  const productionTenantDefs = tenants.filter((tenant) => PRODUCTION_TENANTS.includes(tenant.slug))
  return productionTenantDefs.map(({ customDomain }) => getURL(customDomain))
}
