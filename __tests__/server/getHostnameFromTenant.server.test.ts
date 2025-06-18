import { Tenant } from '@/payload-types'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'

// Mock the getProductionTenantSlugs function
jest.mock('../../src/utilities/tenancy/getProductionTenants', () => ({
  getProductionTenantSlugs: jest.fn(),
}))

import { getProductionTenantSlugs } from '../../src/utilities/tenancy/getProductionTenants'

const mockGetProductionTenantSlugs = getProductionTenantSlugs as jest.MockedFunction<
  typeof getProductionTenantSlugs
>

describe('server-side utilities: getHostnameFromTenant', () => {
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
    mockGetProductionTenantSlugs.mockReturnValue(['production-tenant'])

    const tenant = {
      slug: 'production-tenant',
      customDomain: 'productiondomain.com',
    } as Tenant

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('productiondomain.com')
  })

  it('returns subdomain format for non-production tenants', () => {
    mockGetProductionTenantSlugs.mockReturnValue(['production-tenant'])

    const tenant = {
      slug: 'development-tenant',
      customDomain: 'productiondomain.com',
    } as Tenant

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('development-tenant.envvar.localhost:3000')
  })

  it('handles multiple production tenants correctly', () => {
    mockGetProductionTenantSlugs.mockReturnValue(['tenant1', 'tenant2', 'tenant3'])

    const tenant1: Tenant = {
      slug: 'tenant1',
      customDomain: 'tenant1productiondomain.com',
    } as Tenant

    const tenant2: Tenant = {
      slug: 'tenant2',
      customDomain: 'tenant2productiondomain.com',
    } as Tenant

    const nonProductionTenant: Tenant = {
      slug: 'non-production',
      customDomain: 'tenant3productiondomain.com',
    } as Tenant

    expect(getHostnameFromTenant(tenant1)).toBe('tenant1productiondomain.com')
    expect(getHostnameFromTenant(tenant2)).toBe('tenant2productiondomain.com')
    expect(getHostnameFromTenant(nonProductionTenant)).toBe('non-production.envvar.localhost:3000')
  })

  it('handles empty production tenants list', () => {
    mockGetProductionTenantSlugs.mockReturnValue([])

    const tenant: Tenant = {
      slug: 'any-tenant',
      customDomain: 'custom.example.com',
    } as Tenant

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('any-tenant.envvar.localhost:3000')
  })

  it('handles tenant with empty custom domain by falling back to tenant subdomain', () => {
    mockGetProductionTenantSlugs.mockReturnValue(['production-tenant'])

    const tenant: Tenant = {
      slug: 'production-tenant',
      customDomain: '',
    } as Tenant

    const result = getHostnameFromTenant(tenant)
    expect(result).toBe('production-tenant.envvar.localhost:3000')
  })
})
