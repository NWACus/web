'use client'

import { ZoomPanSurface } from '@/components/ZoomPanSurface'
import { type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

// Pinch/scroll/click-to-zoom wrapper for a single lightbox photo. Mirrors the
// Gallery block's ZoomableImage, but renders a plain <img> from an external URL
// since forecast media are remote URLs rather than Payload Media documents.
export function ZoomablePhoto({
  src,
  alt,
  transformRef,
}: {
  src: string
  alt: string
  /** Lets the lightbox chrome's zoom buttons drive this surface. */
  transformRef?: React.Ref<ReactZoomPanPinchRef>
}) {
  return (
    <ZoomPanSurface
      // The lightbox chrome decides how much room the media gets, and only at layout time, so
      // fill the parent instead of hard-coding a viewport fraction.
      height="100%"
      contentClassName="flex h-full w-full items-center justify-center"
      transformRef={transformRef}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-full max-w-full rounded object-contain" />
    </ZoomPanSurface>
  )
}
