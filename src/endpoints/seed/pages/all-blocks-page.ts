import type { Media, Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'
import { contentWithCallout } from '../blocks/content-with-callout'
import { imageLinkGrid } from '../blocks/image-link-grid'
import { imageQuote } from '../blocks/image-quote'
import { imageText } from '../blocks/image-text'
import { imageTextList } from '../blocks/image-text-list'
import { linkPreview } from '../blocks/link-preview'

export const allBlocksPage: (
  tenant: Tenant,
  image1: Media,
) => RequiredDataFromCollectionSlug<'pages'> = (
  tenant: Tenant,
  image1: Media,
): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: 'blocks',
    tenant: tenant.id,
    title: 'Blocks',
    _status: 'published',
    layout: [
      ...imageLinkGrid(image1),
      ...imageQuote(image1),
      ...imageText(image1),
      ...imageTextList(image1),
      ...linkPreview(image1),
      ...contentWithCallout,
    ],
    meta: {
      title: null,
      image: null,
      description: null,
    },
  }
}
