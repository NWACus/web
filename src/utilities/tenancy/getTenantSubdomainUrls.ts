import { PROTOCOL, ROOT_DOMAIN } from '../domain'
import { VALID_TENANT_SLUGS } from './avalancheCenters'

/**
 * Get all possible tenant subdomain URLs for CSRF configuration.
 * Uses the hardcoded list of valid tenant slugs.
 */
export function getTenantSubdomainUrls(): string[] {
  return VALID_TENANT_SLUGS.map((slug) => `${PROTOCOL}://${slug}.${ROOT_DOMAIN}`)
}
