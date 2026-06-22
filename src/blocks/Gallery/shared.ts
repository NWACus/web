import type { Gallery } from '@/payload-types'

export type GalleryItem = NonNullable<Gallery['items']>[number]

export const isVideoResource = (
  media: GalleryItem['media'],
): media is Exclude<GalleryItem['media'], number> =>
  typeof media === 'object' && media !== null && !!media.mimeType?.includes('video')
