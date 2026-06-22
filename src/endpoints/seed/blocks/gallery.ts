import type { GalleryBlock } from '@/payload-types'

export const galleryBlock = (galleryId: number): GalleryBlock => ({
  blockType: 'gallery',
  gallery: galleryId,
  layout: 'masonry',
  columns: '3',
  heading: 'Season Highlights',
})
