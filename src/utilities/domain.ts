import { Tenant } from '@/payload-types'

export const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
export const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

export async function getHostnameFromTenant(tenant: Tenant) {
  // TODO: does it make sense to add an attribute on the tenants collection that indicates if they have a custom domain? I think yes.
  // Should I also just do the cached API route for the middleware as part of this effort? haha
  // This needs to determine the correct hostname for a tenant so either: {centerSlug}.ROOT_DOMAIN or center's custom domain
  // Should add custom domains to my /etc/hosts file so I can test this locally
  return `${tenant.slug}.${rootDomain}`
}
