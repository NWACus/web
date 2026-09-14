import type { Metadata } from 'next'

import type { Event, Page, Post, Tenant } from '@/payload-types'

import { ogImageUrlForDoc, type OgDocType } from '@/app/api/[center]/og/buildOgImageUrl'
import { getURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'
import { getHostnameFromTenant } from './tenancy/getHostnameFromTenant'
import { resolveTenant } from './tenancy/resolveTenant'

const dynamicOgImage = (url: string) => [{ url, width: 1200, height: 630 }]

function cloneParentMeta(parentMeta?: Metadata) {
  return parentMeta ? JSON.parse(JSON.stringify(parentMeta)) : {}
}

export const generateMetaForPage = async (args: {
  customTitle?: string
  center: string
  doc: Partial<Page>
  slugs?: string[]
  parentMeta?: Metadata
}): Promise<Metadata> => {
  const { doc, slugs, parentMeta } = args

  let tenant: Tenant | undefined
  let hostname

  if (doc.tenant) {
    tenant = await resolveTenant(doc.tenant)
    hostname = getHostnameFromTenant(tenant)
  }

  const serverUrl = getURL(hostname)
  const pageSlugs = slugs ? slugs : doc?.slug
  const url = serverUrl + '/' + (Array.isArray(pageSlugs) ? pageSlugs.join('/') : `${pageSlugs}/`)

  const parentTitle =
    parentMeta?.title && typeof parentMeta?.title !== 'string' && 'absolute' in parentMeta?.title
      ? parentMeta?.title.absolute
      : parentMeta?.title

  const title =
    parentTitle || tenant?.name ? `${doc.title} | ${parentTitle ?? tenant?.name}` : doc.title

  const clonedParentMeta = cloneParentMeta(parentMeta)

  return {
    ...clonedParentMeta,
    title,
    description: doc?.meta?.description,
    alternates: {
      canonical: url,
    },
    openGraph: mergeOpenGraph({
      ...(clonedParentMeta.openGraph || {}),
      description: doc?.meta?.description || '',
      title: title || '',
      url,
    }),
  }
}

// Blog posts and events share identical metadata shaping; they differ only in their
// URL path segment and dynamic OG image type. Complexity is inflated by optional-chaining
// guards and tenant/slug null-checks; this consolidates two previously-duplicated functions.
// fallow-ignore-next-line complexity
const generateMetaForSlugDoc = async (args: {
  customTitle?: string
  center: string
  doc: Partial<Post> | Partial<Event>
  urlPath: 'blog' | 'events'
  ogType: OgDocType
  parentMeta?: Metadata
}): Promise<Metadata> => {
  const { center, customTitle, doc, urlPath, ogType, parentMeta } = args

  let tenant: Tenant | undefined
  let hostname

  if (doc.tenant) {
    tenant = await resolveTenant(doc.tenant)
    hostname = getHostnameFromTenant(tenant)
  }

  const serverUrl = getURL(hostname)
  const url = `${serverUrl}/${urlPath}/${doc?.slug}/`

  const parentTitle =
    parentMeta?.title && typeof parentMeta?.title !== 'string' && 'absolute' in parentMeta?.title
      ? parentMeta?.title.absolute
      : parentMeta?.title

  const title = customTitle ? customTitle : `${doc?.title} | ${parentTitle ?? tenant?.name}`

  // Deep clone parent metadata to avoid mutation issues
  const clonedParentMeta = cloneParentMeta(parentMeta)

  return {
    ...clonedParentMeta,
    title,
    description: doc.description,
    alternates: {
      canonical: url,
    },
    openGraph: mergeOpenGraph({
      ...(clonedParentMeta.openGraph || {}),
      description: doc.description || '',
      title: title || '',
      url,
      ...(doc.slug ? { images: dynamicOgImage(ogImageUrlForDoc(center, ogType, doc.slug)) } : {}),
    }),
  }
}

export const generateMetaForPost = (args: {
  customTitle?: string
  center: string
  doc: Partial<Post>
  parentMeta?: Metadata
}): Promise<Metadata> => generateMetaForSlugDoc({ ...args, urlPath: 'blog', ogType: 'post' })

export const generateMetaForEvent = (args: {
  customTitle?: string
  center: string
  doc: Partial<Event> | null
  parentMeta?: Metadata
}): Promise<Metadata> => {
  const { doc, parentMeta } = args
  if (!doc) {
    return Promise.resolve(parentMeta || {})
  }
  return generateMetaForSlugDoc({ ...args, doc, urlPath: 'events', ogType: 'event' })
}
