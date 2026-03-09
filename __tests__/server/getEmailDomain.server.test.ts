import { AVALANCHE_CENTERS, getEmailDomain } from '../../src/utilities/tenancy/avalancheCenters'

describe('getEmailDomain', () => {
  it('returns the domain as-is when there is no www. prefix', () => {
    expect(getEmailDomain('nwac')).toBe('nwac.us')
  })

  it('strips only the www. prefix, not other subdomains', () => {
    expect(getEmailDomain('cnfaic')).toBe('cnfaic.org')

    expect(getEmailDomain('aaic')).toBe('alaskasnow.org')
  })

  it('strips port numbers from domains (for local development)', () => {
    // Temporarily modify dvac's customDomain to include a port
    const originalDomain = AVALANCHE_CENTERS.dvac.customDomain
    AVALANCHE_CENTERS.dvac.customDomain = 'www.deathvalleyac.local:3000'

    expect(getEmailDomain('dvac')).toBe('deathvalleyac.local')

    // Restore original value
    AVALANCHE_CENTERS.dvac.customDomain = originalDomain
  })
})
