/**
 * @jest-environment node
 */

import { centerRemotePatterns } from '@/utilities/tenancy/centerRemotePatterns'

// Coverage of the real config (every center domain allowed) is in nextConfigLoads.server.test.ts
describe('centerRemotePatterns', () => {
  it('emits one pattern per distinct domain, with the given protocol', () => {
    const centers = {
      a: { customDomain: 'shared.org' },
      b: { customDomain: 'shared.org' },
      c: { customDomain: 'www.other.org' },
    }

    expect(centerRemotePatterns('http', centers)).toEqual([
      { hostname: 'shared.org', protocol: 'http' },
      { hostname: 'www.other.org', protocol: 'http' },
    ])
  })

  it('contains no wildcard or empty hostnames', () => {
    for (const { hostname } of centerRemotePatterns('https')) {
      expect(hostname).not.toContain('*')
      expect(hostname).not.toBe('')
    }
  })
})
