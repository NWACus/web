import { getEmailDomain } from '../../src/utilities/tenancy/avalancheCenters'

describe('getEmailDomain', () => {
  it('returns the domain as-is when there is no www. prefix', () => {
    expect(getEmailDomain('nwac')).toBe('nwac.us')
  })

  it('strips only the www. prefix, not other subdomains', () => {
    expect(getEmailDomain('cnfaic')).toBe('cnfaic.org')

    expect(getEmailDomain('aaic')).toBe('alaskasnow.org')
  })
})
