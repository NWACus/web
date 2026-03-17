import { findCenterByDomain } from '../../src/utilities/tenancy/avalancheCenters'

describe('findCenterByDomain', () => {
  it('finds a center by exact domain match (no www)', () => {
    expect(findCenterByDomain('nwac.us')).toBe('nwac')
    expect(findCenterByDomain('alaskasnow.org')).toBe('aaic')
    expect(findCenterByDomain('avalanche.state.co.us')).toBe('caic')
  })

  it('finds a center when domain has www. prefix', () => {
    expect(findCenterByDomain('www.nwac.us')).toBe('nwac')
    expect(findCenterByDomain('www.cnfaic.org')).toBe('cnfaic')
    expect(findCenterByDomain('www.sierraavalanchecenter.org')).toBe('sac')
  })

  it('finds a center when stored domain has www. but input does not', () => {
    expect(findCenterByDomain('cnfaic.org')).toBe('cnfaic')
    expect(findCenterByDomain('sierraavalanchecenter.org')).toBe('sac')
  })

  it('is case insensitive', () => {
    expect(findCenterByDomain('NWAC.US')).toBe('nwac')
    expect(findCenterByDomain('NwAc.Us')).toBe('nwac')
    expect(findCenterByDomain('WWW.CNFAIC.ORG')).toBe('cnfaic')
    expect(findCenterByDomain('www.SierrAAvAlAnchECentEr.Org')).toBe('sac')
  })

  it('handles domains shared by multiple centers (returns first match)', () => {
    // Multiple centers use 'alaskasnow.org': aaic, cac, earac, hac, vac
    // Should return the first one found (aaic)
    const result = findCenterByDomain('alaskasnow.org')
    expect(result).toBe('aaic')
  })

  it('returns undefined for non-existent domains', () => {
    expect(findCenterByDomain('example.com')).toBeUndefined()
    expect(findCenterByDomain('notarealcenter.org')).toBeUndefined()
    expect(findCenterByDomain('www.doesnotexist.com')).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(findCenterByDomain('')).toBeUndefined()
  })

  it('handles domains with trailing/leading whitespace', () => {
    expect(findCenterByDomain(' nwac.us')).toBe('nwac')
    expect(findCenterByDomain('nwac.us ')).toBe('nwac')
    expect(findCenterByDomain('  nwac.us  ')).toBe('nwac')
  })
})
