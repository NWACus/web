/**
 * @jest-environment node
 */

import { centerRemotePatterns } from '@/utilities/tenancy/centerRemotePatterns'

// Coverage of the real config (production tenants allowed, others not) is in nextConfigLoads.server.test.ts
describe('centerRemotePatterns', () => {
  it('emits one pattern per distinct domain, with the given protocol', () => {
    // hac and vac share alaskasnow.org
    expect(centerRemotePatterns('http', ['hac', 'vac', 'nwac'])).toEqual([
      { hostname: 'alaskasnow.org', protocol: 'http' },
      { hostname: 'nwac.us', protocol: 'http' },
    ])
  })

  it('emits nothing when there are no production tenants', () => {
    expect(centerRemotePatterns('https', [])).toEqual([])
  })
})
