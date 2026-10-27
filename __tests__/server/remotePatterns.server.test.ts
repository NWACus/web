/**
 * @jest-environment node
 */

import { AVALANCHE_CENTERS } from '@/utilities/tenancy/avalancheCenters'

/**
 * next.config.ts derives images.remotePatterns from AVALANCHE_CENTERS using the
 * same de-duplication one-liner tested here. This ensures every center's custom
 * domain is captured and that no wildcard sneaks in.
 */
describe('remotePatterns from AVALANCHE_CENTERS', () => {
  // Same derivation as next.config.ts
  const derivedDomains = [...new Set(Object.values(AVALANCHE_CENTERS).map((c) => c.customDomain))]

  it('includes every center custom domain', () => {
    const domainSet = new Set(derivedDomains)
    for (const [, center] of Object.entries(AVALANCHE_CENTERS)) {
      expect(domainSet.has(center.customDomain)).toBe(true)
    }
  })

  it('de-duplicates shared domains (hac and vac share alaskasnow.org)', () => {
    const allDomains = Object.values(AVALANCHE_CENTERS).map((c) => c.customDomain)
    expect(derivedDomains.length).toBeLessThan(allDomains.length)
    expect(derivedDomains.filter((d) => d === 'alaskasnow.org')).toHaveLength(1)
  })

  it('contains no wildcard or permissive hostnames', () => {
    for (const domain of derivedDomains) {
      expect(domain).not.toContain('**')
      expect(domain).not.toContain('*')
      expect(domain.length).toBeGreaterThan(0)
    }
  })
})
