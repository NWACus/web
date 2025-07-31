import { getCachedTenants } from '@/collections/Tenants/endpoints/cachedPublicTenants'
import { TenantData } from '@/middleware'
import { getAllTenantsFromEdgeConfig } from '@/services/vercel'

export async function getTenants(): Promise<TenantData> {
  let tenants: TenantData = []

  try {
    tenants = await getAllTenantsFromEdgeConfig()
  } catch {}

  try {
    tenants = await getCachedTenants()
  } catch {}

  return tenants
}
