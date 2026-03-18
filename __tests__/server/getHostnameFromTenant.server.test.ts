import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import { PRODUCTION_TENANTS } from '@/utilities/tenancy/tenants'
import { buildTenant } from '../builders'

const originalProductionTenants = [...PRODUCTION_TENANTS]

describe('server-side utilities: getHostnameFromTenant', () => {
  beforeEach(() => {
    PRODUCTION_TENANTS.length = 0
    originalProductionTenants.forEach((slug) => PRODUCTION_TENANTS.push(slug))
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'envvar.localhost:3000'
  })

  afterAll(() => {
    PRODUCTION_TENANTS.length = 0
    originalProductionTenants.forEach((slug) => PRODUCTION_TENANTS.push(slug))
  })

  it('returns NEXT_PUBLIC_ROOT_DOMAIN env var when tenant is null', () => {
    const result = getHostnameFromTenant(null)
    expect(result).toBe('envvar.localhost:3000')
  })

  it('returns NEXT_PUBLIC_ROOT_DOMAIN env var when tenant is undefined', () => {
    // @ts-expect-error intentionally leaving tenant as undefined
    const result = getHostnameFromTenant()
    expect(result).toBe('envvar.localhost:3000')
  })

  it('returns custom domain from AVALANCHE_CENTERS for production tenants', () => {
    PRODUCTION_TENANTS.length = 0
    PRODUCTION_TENANTS.push('nwac')

    const tenant = buildTenant({ slug: 'nwac' })

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('nwac.us')
  })

  it('returns subdomain format for non-production tenants', () => {
    PRODUCTION_TENANTS.length = 0
    PRODUCTION_TENANTS.push('nwac')

    const tenant = buildTenant({ slug: 'sac' })

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('sac.envvar.localhost:3000')
  })

  it('handles multiple production tenants correctly', () => {
    PRODUCTION_TENANTS.length = 0
    PRODUCTION_TENANTS.push('nwac', 'sac', 'uac')

    const tenant1 = buildTenant({ slug: 'nwac' })
    const tenant2 = buildTenant({ slug: 'sac' })
    const nonProductionTenant = buildTenant({ slug: 'btac' })

    expect(getHostnameFromTenant(tenant1)).toBe('nwac.us')
    expect(getHostnameFromTenant(tenant2)).toBe('www.sierraavalanchecenter.org')
    expect(getHostnameFromTenant(nonProductionTenant)).toBe('btac.envvar.localhost:3000')
  })

  it('handles empty production tenants list', () => {
    PRODUCTION_TENANTS.length = 0

    const tenant = buildTenant({ slug: 'nwac' })

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('nwac.envvar.localhost:3000')
  })
})
