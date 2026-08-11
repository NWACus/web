'use client'

import { ImageMedia } from '@/components/Media/ImageMedia'
import { ZoomPanSurface } from '@/components/ZoomPanSurface'
import { type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import type { GalleryItem } from './shared'

// Zoom/pan for one lightbox image; the zoom buttons live in GalleryLightbox and
// drive this through `transformRef`.
export const ZoomableImage = ({
  resource,
  transformRef,
}: {
  resource: GalleryItem['media']
  transformRef: React.Ref<ReactZoomPanPinchRef>
}) => {
  return (
    <ZoomPanSurface
      height="85vh"
      contentClassName="relative h-[85vh] w-full"
      transformRef={transformRef}
    >
      <ImageMedia resource={resource} fill imgClassName="object-contain pointer-events-none" />
    </ZoomPanSurface>
  )
}
