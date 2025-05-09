import type { Media, Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'
import { imageLinkGrid } from '../blocks/image-link-grid'
import { imageTextList } from '../blocks/image-text-list'
import { LinkPreview } from '../blocks/link-preview'

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
    hero: {
      type: 'lowImpact',
      richText: null,
      links: [],
      media: null,
    },
    layout: [...imageTextList(image1), ...LinkPreview(image1), ...imageLinkGrid(image1)],
    meta: {
      title: null,
      image: null,
      description: null,
    },
  }
}
