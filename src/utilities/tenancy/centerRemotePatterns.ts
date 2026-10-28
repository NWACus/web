// Imported by next.config.ts, which can't resolve `@/` aliases; nextConfigLoads.server.test.ts enforces it
import { AVALANCHE_CENTERS } from './avalancheCenters'

type CenterRemotePattern = { hostname: string; protocol: 'http' | 'https' }

/** One `images.remotePatterns` entry per distinct center custom domain (hac and vac share one). */
export function centerRemotePatterns(
  protocol: 'http' | 'https',
  centers: Readonly<Record<string, { readonly customDomain: string }>> = AVALANCHE_CENTERS,
): CenterRemotePattern[] {
  const domains = new Set(Object.values(centers).map((center) => center.customDomain))
  return Array.from(domains, (hostname) => ({ hostname, protocol }))
}
