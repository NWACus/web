import { Tenant } from '@/payload-types'
import configPromise from '@payload-config'
import { cookies, headers } from 'next/headers'
import { getPayload } from 'payload'

interface TenantDomainScopeResult {
  isDomainScoped: boolean
  tenant: Tenant | null
}

export async function isTenantDomainScoped(): Promise<TenantDomainScopeResult> {
  const headersList = await headers()
  const host = headersList.get('host')
  const cookieStore = await cookies()
  const payloadTenantCookie = cookieStore.get('payload-tenant')

  const payload = await getPayload({ config: configPromise })
  const tenantsRes = await payload.find({
    collection: 'tenants',
    limit: 1000,
    select: {
      id: true,
      slug: true,
      customDomain: true,
    },
  })

  // Find the tenant that matches the current domain
  const domainScopedTenant = host
    ? tenantsRes.docs.find((tenant) => {
        const isTenantCustomDomain = tenant?.customDomain && host === tenant.customDomain
        const isTenantSubdomain = tenant?.slug && host.startsWith(`${tenant.slug}.`)
        return isTenantCustomDomain || isTenantSubdomain
      })
    : null

  const isDomainScoped = !!domainScopedTenant && !!payloadTenantCookie

  return {
    isDomainScoped,
    tenant: isDomainScoped ? domainScopedTenant : null,
  }
}
