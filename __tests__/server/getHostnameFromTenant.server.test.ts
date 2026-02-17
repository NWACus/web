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

  it('returns custom domain for production tenants', () => {
    // Use a valid tenant slug from AVALANCHE_CENTERS
    PRODUCTION_TENANTS.length = 0
    PRODUCTION_TENANTS.push('nwac')

    const tenant = buildTenant({ slug: 'nwac', customDomain: 'nwac.us' })

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('nwac.us')
  })

  it('returns subdomain format for non-production tenants', () => {
    // Only nwac is a production tenant; sac is valid but not in PRODUCTION_TENANTS
    PRODUCTION_TENANTS.length = 0
    PRODUCTION_TENANTS.push('nwac')

    const tenant = buildTenant({
      slug: 'sac',
      customDomain: 'sierraavalanchecenter.org',
    })

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('sac.envvar.localhost:3000')
  })

  it('handles multiple production tenants correctly', () => {
    PRODUCTION_TENANTS.length = 0
    PRODUCTION_TENANTS.push('nwac', 'sac', 'uac')

    const tenant1 = buildTenant({
      slug: 'nwac',
      customDomain: 'nwac.us',
    })
    const tenant2 = buildTenant({
      slug: 'sac',
      customDomain: 'sierraavalanchecenter.org',
    })
    const nonProductionTenant = buildTenant({
      slug: 'btac',
      customDomain: 'bridgertetonavalanchecenter.org',
    })

    expect(getHostnameFromTenant(tenant1)).toBe('nwac.us')
    expect(getHostnameFromTenant(tenant2)).toBe('sierraavalanchecenter.org')
    expect(getHostnameFromTenant(nonProductionTenant)).toBe('nwac.us')
  })

  it('handles empty production tenants list', () => {
    PRODUCTION_TENANTS.length = 0

    const tenant = buildTenant({ slug: 'nwac', customDomain: 'nwac.us' })

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('nwac.envvar.localhost:3000')
  })

  it('handles tenant with empty custom domain by falling back to tenant subdomain', () => {
    PRODUCTION_TENANTS.length = 0
    PRODUCTION_TENANTS.push('nwac')

    const tenant = buildTenant({ slug: 'nwac', customDomain: '' })

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('nwac.envvar.localhost:3000')
  })
})
