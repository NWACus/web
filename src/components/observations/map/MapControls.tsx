'use client'

/**
 * The two map controls Mapbox doesn't provide: the widget's reset-to-starting-view button, and —
 * on a desktop — the one that widens the map over the list. Handed to Mapbox as one control group
 * so they stack with its zoom buttons.
 */
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react'
import type { RefObject } from 'react'

// `!flex` is required: mapbox-gl.css sets `display: block` on control-group buttons.
const CHROME =
  'h-full w-full items-center justify-center bg-white text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
const BUTTON = `!flex ${CHROME}`

interface MapControlsProps {
  controlsRef: RefObject<HTMLDivElement | null>
  onReset: () => void
  expanded: boolean
  onToggleExpanded: () => void
}

export function MapControls({
  controlsRef,
  onReset,
  expanded,
  onToggleExpanded,
}: MapControlsProps) {
  const expandLabel = expanded ? 'Show list' : 'Expand map'
  return (
    <div ref={controlsRef} className="mapboxgl-ctrl mapboxgl-ctrl-group overflow-hidden">
      <button type="button" onClick={onReset} className={BUTTON} title="Reset map to initial zoom">
        <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">Reset map to initial zoom</span>
      </button>
      <button
        type="button"
        onClick={onToggleExpanded}
        // Desktop only, as in the widget: on a phone the list already sits below the map.
        className={`!hidden lg:!flex ${CHROME}`}
        title={expandLabel}
        aria-pressed={expanded}
      >
        {expanded ? (
          <Minimize2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Maximize2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span className="sr-only">{expandLabel}</span>
      </button>
    </div>
  )
}
