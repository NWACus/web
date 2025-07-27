export function validateProductionTenants(productionTenantsEnv?: string): string[] {
  const envValue = productionTenantsEnv ?? process.env.PRODUCTION_TENANTS ?? ''

  if (!envValue.trim()) {
    return []
  }

  const tenantSlugs = envValue
    .split(',')
    .map((str) => str.trim())
    .filter((str) => str.length > 0)

  return tenantSlugs
}

export const PRODUCTION_TENANTS = validateProductionTenants()
