import { BLOCK_MARGIN } from '@/components/BackgroundColorWrapper'
import RichText from '@/components/RichText'
import type { GalleryBlock as GalleryBlockProps } from '@/payload-types'
import { isValidRelationship } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { GalleryGrid } from './GalleryGrid'
import { isRenderableItem } from './shared'

export const GalleryBlockComponent = ({
  gallery,
  description,
  layout,
  columns,
}: GalleryBlockProps) => {
  if (!isValidRelationship(gallery)) {
    return null
  }

  const items = (gallery.items ?? []).filter(isRenderableItem)
  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn('container', BLOCK_MARGIN)}>
      {description && (
        <div className="mt-2 mb-6">
          <RichText data={description} enableGutter={false} />
        </div>
      )}
      <GalleryGrid items={items} layout={layout ?? 'grid'} columns={columns ?? '4'} />
    </div>
  )
}
