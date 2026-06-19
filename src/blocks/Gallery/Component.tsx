import RichText from '@/components/RichText'
import type { GalleryBlock as GalleryBlockProps } from '@/payload-types'
import { isValidRelationship } from '@/utilities/relationships'
import { GalleryGrid } from './GalleryGrid'

export const GalleryBlockComponent = ({
  gallery,
  heading,
  description,
  layout,
  columns,
}: GalleryBlockProps) => {
  if (!isValidRelationship(gallery)) {
    return null
  }

  const items = gallery.items ?? []
  if (items.length === 0) {
    return null
  }

  return (
    <div className="container py-10">
      {heading && <h2 className="text-3xl font-semi-bold">{heading}</h2>}
      {description && (
        <div className="mt-2 mb-6">
          <RichText data={description} enableGutter={false} />
        </div>
      )}
      <GalleryGrid items={items} layout={layout ?? 'grid'} columns={columns ?? '4'} />
    </div>
  )
}
