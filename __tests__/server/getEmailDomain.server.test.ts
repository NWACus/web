import { getEmailDomain } from '../../src/utilities/tenancy/avalancheCenters'

describe('getEmailDomain', () => {
  it('returns the domain as-is when there is no www. prefix', () => {
    expect(getEmailDomain('nwac')).toBe('nwac.us')
  })

  it('strips only the www. prefix, not other subdomains', () => {
    // cnfaic has customDomain 'www.cnfaic.org' — www. should be stripped
    expect(getEmailDomain('cnfaic')).toBe('cnfaic.org')

    // aaic has customDomain 'alaskasnow.org' — no www., returned as-is
    expect(getEmailDomain('aaic')).toBe('alaskasnow.org')
  })
})
