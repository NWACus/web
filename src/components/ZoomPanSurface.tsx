'use client'

import { cn } from '@/utilities/ui'
import { useRef, useState } from 'react'
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch'

/**
 * Shared pinch/scroll/click-to-zoom surface for a single lightbox image.
 *
 * Click-to-zoom is implemented on pointer up rather than onClick so a pan (drag) isn't mistaken
 * for a click. The library transforms via the DOM without re-rendering, so the scale is mirrored
 * in state purely to keep the cursor affordance in sync.
 *
 * Callers supply the rendered image and the sizing: the Gallery block fills its container with a
 * Payload `ImageMedia`, while the forecast lightbox renders a plain `<img>` from a remote URL.
 * `contentClassName` must be a literal Tailwind class — heights can't be interpolated.
 */
export function ZoomPanSurface({
  height,
  contentClassName,
  transformRef,
  children,
}: {
  /** Height for the zoom surface: a viewport fraction like `'70vh'`, or `'100%'` to fill a
   * parent that has already been sized (the Gallery lightbox's full-screen chrome). */
  height: string
  contentClassName: string
  /** Lets a parent drive zoom from its own controls (the Gallery lightbox's buttons). */
  transformRef?: React.Ref<ReactZoomPanPinchRef>
  children: React.ReactNode
}) {
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null)
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
          // Inline rather than a utility class: the library injects its own
          // `.transform-component-module_wrapper` rule after Tailwind's stylesheet, and at equal
          // specificity a class on the wrapper loses.
          wrapperStyle={{ width: '100%', height }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          <div
            className={cn(
              contentClassName,
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
            {children}
          </div>
        </TransformComponent>
      )}
    </TransformWrapper>
  )
}
