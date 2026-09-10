'use client'

/**
 * The one map control Mapbox doesn't provide: the widget's reset-to-configured-view button. It is
 * handed to Mapbox as a control so it stacks with fullscreen and zoom in the widget's order.
 */
import { RotateCcw } from 'lucide-react'
import type { RefObject } from 'react'

// `!flex` is required: mapbox-gl.css sets `display: block` on control-group buttons, which would
// otherwise leave the icon flush against the left edge instead of centered.
const BUTTON_CHROME =
  '!flex h-full w-full items-center justify-center bg-white text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

interface StationMapControlsProps {
  /** Container Mapbox mounts into its top-right corner, above fullscreen and zoom. */
  resetRef: RefObject<HTMLDivElement | null>
  onReset: () => void
}

export function StationMapControls({ resetRef, onReset }: StationMapControlsProps) {
  return (
    <div ref={resetRef} className="mapboxgl-ctrl mapboxgl-ctrl-group overflow-hidden">
      <button
        type="button"
        onClick={onReset}
        className={BUTTON_CHROME}
        title="Reset map to initial zoom"
      >
        <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">Reset map to initial zoom</span>
      </button>
    </div>
  )
}
