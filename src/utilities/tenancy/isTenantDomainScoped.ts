import { Tenant } from '@/payload-types'
import { findCenterByDomain, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import configPromise from '@payload-config'
import { cookies, headers } from 'next/headers'
import { getPayload } from 'payload'

type TenantDomainScopeResult =
  | {
      isDomainScoped: true
      tenant: Tenant
    }
  | {
      isDomainScoped: false
      tenant: null
    }

export async function isTenantDomainScoped(): Promise<TenantDomainScopeResult> {
  const headersList = await headers()
  const host = headersList.get('host')
  const cookieStore = await cookies()
  const payloadTenantCookie = cookieStore.get('payload-tenant')

  if (!host || !payloadTenantCookie) {
    return { isDomainScoped: false, tenant: null }
  }

  // Try to find a matching slug via custom domain or subdomain
  let matchedSlug: string | undefined = findCenterByDomain(host)

  if (!matchedSlug) {
    // Extract subdomain from host (e.g., "nwac" from "nwac.localhost:3000")
    const subdomain = host.split('.')[0]
    if (isValidTenantSlug(subdomain)) {
      matchedSlug = subdomain
    }
  }

  if (!matchedSlug) {
    return { isDomainScoped: false, tenant: null }
  }

  const payload = await getPayload({ config: configPromise })
  const tenantsRes = await payload.find({
    collection: 'tenants',
    limit: 1,
    where: {
      slug: { equals: matchedSlug },
    },
  })

  const domainScopedTenant = tenantsRes.docs[0] ?? null

  if (!domainScopedTenant) {
    return { isDomainScoped: false, tenant: null }
  }

  return {
    isDomainScoped: true,
    tenant: domainScopedTenant,
  }
}
