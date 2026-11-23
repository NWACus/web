// Loaded by middleware too, so keep imports free of Payload.
import { PROTOCOL, ROOT_DOMAIN } from '../../utilities/domain'
import {
  AVALANCHE_CENTERS,
  findCenterByDomain,
  isValidTenantSlug,
  VALID_TENANT_SLUGS,
  type ValidTenantSlug,
} from '../../utilities/tenancy/avalancheCenters'

/** The apex (ROOT_DOMAIN) is the Member auth server and account home (ADR 026). */
export const APEX_HOST = ROOT_DOMAIN
export const APEX_ORIGIN = `${PROTOCOL}://${ROOT_DOMAIN}`

export function isApexHost(host: string | null | undefined): boolean {
  return !!host && host.toLowerCase() === APEX_HOST.toLowerCase()
}

/**
 * Resolves a request host to a center slug: `<slug>.<ROOT_DOMAIN>` locally and on dev,
 * a custom domain in production. Returns undefined for the apex and unknown hosts.
 */
export function findCenterByHost(host: string | null | undefined): ValidTenantSlug | undefined {
  if (!host) return undefined
  const lower = host.toLowerCase()
  const suffix = `.${APEX_HOST.toLowerCase()}`
  if (lower.endsWith(suffix)) {
    const slug = lower.slice(0, -suffix.length)
    return isValidTenantSlug(slug) ? slug : undefined
  }
  return findCenterByDomain(lower)
}

export function isCenterHost(host: string | null | undefined): boolean {
  return findCenterByHost(host) !== undefined
}

/** Every host Better Auth may answer on: the apex, center subdomains, and center custom domains. */
export function memberAuthAllowedHosts(): string[] {
  const hosts = new Set<string>([APEX_HOST])
  for (const slug of VALID_TENANT_SLUGS) {
    hosts.add(`${slug}.${APEX_HOST}`)
    hosts.add(AVALANCHE_CENTERS[slug].customDomain)
  }
  return [...hosts]
}
