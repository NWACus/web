import type { Metadata } from 'next'

import type { Event, Page, Post, Tenant } from '@/payload-types'

import { getURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'
import { getHostnameFromTenant } from './tenancy/getHostnameFromTenant'
import { resolveTenant } from './tenancy/resolveTenant'

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

export const generateMetaForPost = async (args: {
  customTitle?: string
  center: string
  doc: Partial<Post>
  parentMeta?: Metadata
}): Promise<Metadata> => {
  const { customTitle, doc, parentMeta } = args

  let tenant: Tenant | undefined
  let hostname

  if (doc.tenant) {
    tenant = await resolveTenant(doc.tenant)
    hostname = getHostnameFromTenant(tenant)
  }

  const serverUrl = getURL(hostname)
  const url = `${serverUrl}/blog/${doc?.slug}/`

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
    }),
  }
}

export const generateMetaForEvent = async (args: {
  customTitle?: string
  center: string
  doc: Partial<Event> | null
  parentMeta?: Metadata
}): Promise<Metadata> => {
  const { customTitle, doc, parentMeta } = args

  if (!doc) {
    return parentMeta || {}
  }

  let tenant: Tenant | undefined
  let hostname

  if (doc.tenant) {
    tenant = await resolveTenant(doc.tenant)
    hostname = getHostnameFromTenant(tenant)
  }

  const serverUrl = getURL(hostname)
  const url = `${serverUrl}/events/${doc?.slug}/`

  const parentTitle =
    parentMeta?.title && typeof parentMeta?.title !== 'string' && 'absolute' in parentMeta?.title
      ? parentMeta?.title.absolute
      : parentMeta?.title

  const title = customTitle ? customTitle : `${doc?.title} | ${parentTitle ?? tenant?.name}`

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
    }),
  }
}
