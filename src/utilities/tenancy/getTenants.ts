import { getCachedTenants } from '@/collections/Tenants/endpoints/cachedPublicTenants'
import { TenantData } from '@/middleware'
import { getAllTenantsFromEdgeConfig } from '@/services/vercel'

export async function getTenants(): Promise<TenantData> {
  let tenants: TenantData = []

  try {
    tenants = await getAllTenantsFromEdgeConfig()
  } catch (error) {
    console.warn(
      'Failed to get all tenants from Edge Config, falling back to cached API route:',
      error instanceof Error ? error.message : error,
    )
  }

  try {
    tenants = await getCachedTenants()
  } catch (error) {
    console.warn('Failed to get cached tenants:', error instanceof Error ? error.message : error)
  }

  return tenants
}
