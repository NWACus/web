'use client'

import { ImageMedia } from '@/components/Media/ImageMedia'
import { ZoomPanSurface } from '@/components/ZoomPanSurface'
import { type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import type { GalleryItem } from './shared'

// Zoom/pan for one lightbox image; the zoom buttons live in the lightbox chrome and
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
      // The lightbox chrome decides how much room the media gets, and only at layout time, so
      // fill the parent instead of hard-coding a viewport fraction.
      height="100%"
      contentClassName="relative h-full w-full"
      transformRef={transformRef}
    >
      <ImageMedia resource={resource} fill imgClassName="object-contain pointer-events-none" />
    </ZoomPanSurface>
  )
}
