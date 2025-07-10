import { Tenant } from '@/payload-types'
import { CollectionSlug, PayloadRequest } from 'payload'
import { getURL } from './getURL'

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: '/blog',
  pages: '',
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  tenant: Partial<Tenant> | null
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug, tenant, req }: Props) => {
  // Check if current host is the tenant's domain
  const currentHost = req.headers.get('host') || req.host
  const isTenantCustomDomain = tenant?.customDomain && currentHost === tenant.customDomain
  const isTenantSubdomain = tenant?.slug && currentHost.startsWith(`${tenant.slug}.`)

  // Only include tenant slug in path if not already on tenant's domain or subdomain
  const shouldIncludeTenantSlug = tenant?.slug && !isTenantCustomDomain && !isTenantSubdomain

  const path = `${shouldIncludeTenantSlug && tenant ? `/${tenant.slug}` : ''}${collectionPrefixMap[collection]}${slug ? `/${slug}` : ''}`

  const params = {
    slug,
    collection,
    path,
  }

  const encodedParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    encodedParams.append(key, value)
  })

  const url = `${getURL(currentHost)}/${shouldIncludeTenantSlug ? `${tenant.slug}/` : ''}next/preview?${encodedParams.toString()}`

  return url
}
