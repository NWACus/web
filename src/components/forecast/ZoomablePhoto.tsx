'use client'

import { ZoomPanSurface } from '@/components/ZoomPanSurface'

// Pinch/scroll/click-to-zoom wrapper for a single lightbox photo. Mirrors the
// Gallery block's ZoomableImage, but renders a plain <img> from an external URL
// since forecast media are remote URLs rather than Payload Media documents.
export function ZoomablePhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <ZoomPanSurface
      height="70vh"
      contentClassName="flex h-[70vh] w-full items-center justify-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-full max-w-full rounded object-contain" />
    </ZoomPanSurface>
  )
}
