import type { Metadata } from 'next'

import type { Config, Media, Page, Post } from '@/payload-types'

import { getURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getURL()

  let url = serverUrl + '/assets/avy-web-fallback-og-image.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

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

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title
    ? `${doc?.meta?.title} | ${typeof doc?.tenant === 'object' && doc.tenant.name ? doc.tenant.name : 'Avy'}`
    : 'Avy'

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
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

  const ogImage = getImageURL(doc?.featuredImage)

  const title = customTitle ? customTitle : `${doc?.title} ' | '${center}`

  return {
    description: doc?.description,
    openGraph: mergeOpenGraph({
      description: doc?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url,
    }),
    title,
  }
}
