'use client'

import { ImageMedia } from '@/components/Media/ImageMedia'
import { cn } from '@/utilities/ui'
import { useRef, useState } from 'react'
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch'
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
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null)
  // The library transforms via the DOM without re-rendering, so mirror the scale
  // in state to keep the cursor in sync.
  const [scale, setScale] = useState(1)

  return (
    <TransformWrapper
      ref={transformRef}
      initialScale={1}
      minScale={1}
      maxScale={5}
      centerOnInit
      doubleClick={{ disabled: true }}
      wheel={{ step: 0.15 }}
      onTransform={(_, state) => setScale(state.scale)}
    >
      {({ zoomIn, resetTransform, instance }) => (
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '85vh' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          <div
            className={cn(
              'relative h-[85vh] w-full',
              scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
            )}
            onPointerDown={(e) => {
              pointerDownAt.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerUp={(e) => {
              const start = pointerDownAt.current
              pointerDownAt.current = null
              // Treat a near-stationary pointer as a click; ignore drags (pans).
              if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return
              if (instance.state.scale > 1) resetTransform()
              else zoomIn()
            }}
          >
            <ImageMedia
              resource={resource}
              fill
              imgClassName="object-contain pointer-events-none"
            />
          </div>
        </TransformComponent>
      )}
    </TransformWrapper>
  )
}
