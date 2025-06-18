import type { Metadata } from 'next'
import { getURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Avalanche center website.',
  images: [
    {
      url: `${getURL()}/assets/avy-web-fallback-og-image.webp`,
    },
  ],
  siteName: 'Avy',
  title: 'Avy',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
