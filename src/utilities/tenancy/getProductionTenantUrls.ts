import { getURL } from '../getURL'
import { AVALANCHE_CENTERS } from './avalancheCenters'
import { PRODUCTION_TENANTS } from './tenants'

/**
 * Get all production tenant custom domain URLs for CORS configuration.
 * Uses the hardcoded list of avalanche centers and production tenants.
 */
export function getProductionTenantUrls(): string[] {
  return PRODUCTION_TENANTS.map((slug) => getURL(AVALANCHE_CENTERS[slug].customDomain))
}
