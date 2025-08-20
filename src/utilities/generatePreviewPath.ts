import { getCanonicalUrlForSlug } from '@/components/Header/utils'
import { Tenant } from '@/payload-types'
import { CollectionSlug, PayloadRequest } from 'payload'
import { getURL } from './getURL'
import { normalizePath } from './path'

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

export const generatePreviewPath = async ({ collection, slug, tenant, req }: Props) => {
  // Check if current host is the tenant's domain
  const currentHost = req.headers.get('host') || req.host
  const isTenantCustomDomain = tenant?.customDomain && currentHost === tenant.customDomain
  const isTenantSubdomain = tenant?.slug && currentHost.startsWith(`${tenant.slug}.`)

  // Only include tenant slug in path if not already on tenant's domain or subdomain
  const shouldIncludeTenantSlug = tenant?.slug && !isTenantCustomDomain && !isTenantSubdomain

  let canonicalSlug = slug

  // Exception for pages collection which has a concept of canonical urls based on their nesting in the navigation
  if (tenant?.slug && collection === 'pages') {
    const canonicalUrl = await getCanonicalUrlForSlug(tenant.slug, slug)

    if (canonicalUrl) {
      canonicalSlug = normalizePath(canonicalUrl)
    }
  }

  const path = `${shouldIncludeTenantSlug && tenant ? `/${tenant.slug}` : ''}${collectionPrefixMap[collection]}${canonicalSlug ? `/${canonicalSlug}` : ''}`

  const params = {
    slug: canonicalSlug,
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
