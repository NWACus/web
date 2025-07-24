import { STATIC_TENANTS } from '@/generated/tenants'

export function validateProductionTenants(productionTenantsEnv?: string): string[] {
  const envValue = productionTenantsEnv ?? process.env.PRODUCTION_TENANTS ?? ''

  if (!envValue.trim()) {
    return []
  }

  const tenantSlugs = envValue
    .split(',')
    .map((str) => str.trim())
    .filter((str) => str.length > 0)

  const validTenantSlugs = STATIC_TENANTS.map((tenant) => tenant.slug)
  const validProduction = tenantSlugs.filter((slug) => validTenantSlugs.includes(slug))
  const invalidTenants = tenantSlugs.filter((slug) => !validTenantSlugs.includes(slug))

  if (invalidTenants.length > 0) {
    console.warn(
      `Invalid tenant slugs found in PRODUCTION_TENANTS env var. Omitting: ${invalidTenants.join(', ')}. Valid tenant slugs are: ${validTenantSlugs.join(', ')}`,
    )
  }

  return validProduction
}

export const PRODUCTION_TENANTS = validateProductionTenants()
