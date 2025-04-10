import { Tenant } from '@/payload-types'
import { CollectionSlug, PayloadRequest } from 'payload'

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: '/posts',
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
  const isTenantDomain =
    tenant?.domains && tenant.domains.some(({ domain }) => currentHost === domain)
  const isTenantSubdomain = tenant?.slug && currentHost.startsWith(`${tenant.slug}.`)

  // Only include tenant slug in path if not already on tenant's domain or subdomain
  const shouldIncludeTenantSlug = tenant?.slug && !isTenantDomain && !isTenantSubdomain

  const path = `${shouldIncludeTenantSlug && tenant ? `/${tenant.slug}/` : ''}${collectionPrefixMap[collection]}/${slug}`

  const params = {
    slug,
    collection,
    path,
  }

  const encodedParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    encodedParams.append(key, value)
  })

  const isProduction =
    process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  const protocol = isProduction ? 'https:' : req.protocol

  const url = `${protocol}//${currentHost}/${shouldIncludeTenantSlug ? `${tenant.slug}/` : ''}next/preview?${encodedParams.toString()}`

  return url
}
