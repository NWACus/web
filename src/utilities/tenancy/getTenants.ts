import { TenantData } from '@/middleware'
import { getAllTenantsFromEdgeConfig } from '@/services/vercel'

export async function getTenants(): Promise<TenantData> {
  try {
    return getAllTenantsFromEdgeConfig()
  } catch (error) {
    console.error(
      'Failed to get all tenants from Edge Config, make sure you have set the VERCEL_EDGE_CONFIG env var. Error: ',
      error instanceof Error ? error.message : error,
    )
    return []
  }
}
