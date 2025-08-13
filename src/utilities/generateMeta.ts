import type { Metadata } from 'next'

import type { Page, Post } from '@/payload-types'

import { getURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

export const generateMetaForPage = async (args: {
  customTitle?: string
  center: string
  doc: Partial<Page>
  slugs?: string[]
}): Promise<Metadata> => {
  const { doc, slugs } = args

  const serverUrl = getURL()
  const pageSlugs = slugs ? slugs : doc?.slug
  const url = serverUrl + '/' + (Array.isArray(pageSlugs) ? pageSlugs.join('/') : `${pageSlugs}/`)

  const title = doc?.meta?.title
    ? `${doc?.meta?.title} | ${typeof doc?.tenant === 'object' && doc.tenant.name ? doc.tenant.name : 'Avy'}`
    : 'Avy'

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      title,
      url,
    }),
    title,
  }
}

export const generateMetaForPost = async (args: {
  customTitle?: string
  center: string
  doc: Partial<Post>
}): Promise<Metadata> => {
  const { customTitle, center, doc } = args

  const serverUrl = getURL()
  const url = `${serverUrl}/blog/${doc?.slug}/`

  const title = customTitle ? customTitle : `${doc?.title} ' | '${center}`

  return {
    description: doc?.description,
    openGraph: mergeOpenGraph({
      description: doc?.description || '',
      title,
      url,
    }),
    title,
  }
}
