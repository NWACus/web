'use client'

import { cn } from '@/utilities/ui'
import { useRef, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

// Pinch/scroll/click-to-zoom wrapper for a single lightbox photo. Mirrors the
// Gallery block's ZoomableImage, but renders a plain <img> from an external URL
// since forecast media are remote URLs rather than Payload Media documents.
export function ZoomablePhoto({ src, alt }: { src: string; alt: string }) {
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null)
  // The library transforms via the DOM without re-rendering, so mirror the scale
  // in state to keep the cursor in sync.
  const [scale, setScale] = useState(1)

  return (
    <TransformWrapper
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
          wrapperStyle={{ width: '100%', height: '70vh' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          <div
            className={cn(
              'flex h-[70vh] w-full items-center justify-center',
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="max-h-full max-w-full rounded object-contain" />
          </div>
        </TransformComponent>
      )}
    </TransformWrapper>
  )
}
