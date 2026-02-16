import { AVALANCHE_CENTERS, isValidTenantSlug, ValidTenantSlug } from './avalancheCenters'

/**
 * Validates production tenants from environment variable.
 * Only slugs that exist in AVALANCHE_CENTERS are considered valid.
 */
export function validateProductionTenants(productionTenantsEnv?: string): ValidTenantSlug[] {
  const envValue = productionTenantsEnv ?? process.env.PRODUCTION_TENANTS ?? ''

  if (!envValue.trim()) {
    return []
  }

  const tenantSlugs = envValue
    .split(',')
    .map((str) => str.trim())
    .filter(isValidTenantSlug)

  return tenantSlugs
}

export const PRODUCTION_TENANTS = validateProductionTenants()

/**
 * Check if a slug is a production tenant.
 * Works with any string input (doesn't require ValidTenantSlug type).
 */
export function isProductionTenant(slug: string): slug is ValidTenantSlug {
  return isValidTenantSlug(slug) && PRODUCTION_TENANTS.includes(slug)
}

/**
 * Get custom domain for a production tenant.
 * Returns undefined if tenant is not in PRODUCTION_TENANTS or has no custom domain.
 */
export function getProductionCustomDomain(slug: string): string | undefined {
  if (!isValidTenantSlug(slug) || !PRODUCTION_TENANTS.includes(slug)) {
    return undefined
  }
  return AVALANCHE_CENTERS[slug].customDomain
}
