import type { Gallery } from '@/payload-types'
import { isValidRelationship } from '@/utilities/relationships'

export type GalleryItem = NonNullable<Gallery['items']>[number]

export const isVideoResource = (
  media: GalleryItem['media'],
): media is Exclude<GalleryItem['media'], number> =>
  typeof media === 'object' && media !== null && !!media.mimeType?.includes('video')

// An upload item whose media was deleted resolves to a null relationship; drop it
export const isRenderableItem = (item: GalleryItem): boolean =>
  item.type === 'video' ? true : isValidRelationship(item.media)
