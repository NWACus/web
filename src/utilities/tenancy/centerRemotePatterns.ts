// Loaded by next.config.ts, which can't resolve `@/` aliases: keep imports relative (eslint.config.mjs enforces it)
import { AVALANCHE_CENTERS, type ValidTenantSlug } from './avalancheCenters'
import { validateProductionTenants } from './tenants'

type CenterRemotePattern = { hostname: string; protocol: 'http' | 'https' }

/**
 * One `images.remotePatterns` entry per distinct production tenant custom domain (hac and vac share
 * one). Non-production centers are left out: their images are served from `<slug>.<root domain>`,
 * and their custom domains still point at sites we don't host.
 */
export function centerRemotePatterns(
  protocol: 'http' | 'https',
  slugs: readonly ValidTenantSlug[] = validateProductionTenants(),
): CenterRemotePattern[] {
  const domains = new Set(slugs.map((slug) => AVALANCHE_CENTERS[slug].customDomain))
  return Array.from(domains, (hostname) => ({ hostname, protocol }))
}
