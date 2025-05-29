import type { Metadata } from 'next'

import type { Config, Media, Page, Post } from '@/payload-types'

import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/assets/avy-web-fallback-og-image.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMetaPage = async (args: { doc: Partial<Page> }): Promise<Metadata> => {
  const { doc } = args || {}

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
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}

export const generateMetaPost = async (args: { doc: Partial<Post> }): Promise<Metadata> => {
  const { doc } = args || {}

  const ogImage = getImageURL(doc?.featuredImage)

  const title = doc?.title ? doc?.title + ' | Payload Website Template' : 'Payload Website Template'

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
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
