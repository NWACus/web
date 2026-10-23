'use client'

/**
 * The two map affordances Mapbox doesn't provide: a link out to the national danger map and a
 * re-center button. Both carried over from the legacy widget, and placed the way it places them.
 *
 * The link is pinned to the map's top-left corner and the search box is centered between 60px
 * insets, so the two share that edge without colliding — which is why the link is positioned
 * absolutely rather than handed to Mapbox's top-left control stack, where it would sit *under* the
 * search box and shove it out of the centre. The re-center button has no such constraint, so it
 * does go through `addControl` and stacks under zoom and geolocate.
 */
import { RotateCw } from 'lucide-react'
import Image from 'next/image'
import type { RefObject } from 'react'

const NATIONAL_MAP_URL = 'https://avalanche.org/'

/** Mapbox's own control chrome, so these read as part of the same set of buttons. */
// `!flex` is required on the re-center button: mapbox-gl.css sets `display: block` on control-group
// buttons, which would otherwise leave the icon flush against the left edge instead of centered.
const BUTTON_CHROME =
  '!flex items-center justify-center bg-white text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

interface DangerMapControlsProps {
  /** Container Mapbox mounts into its top-right corner, under zoom and geolocate. */
  recenterRef: RefObject<HTMLDivElement | null>
  onRecenter: () => void
}

export function DangerMapControls({ recenterRef, onRecenter }: DangerMapControlsProps) {
  return (
    <>
      {/* Pinned to the corner the widget pins it to, clear of the centered search box. */}
      <a
        href={NATIONAL_MAP_URL}
        target="_blank"
        rel="noopener noreferrer"
        // `overflow-hidden` keeps the hover fill inside the rounded corners — without it the
        // background paints square over them.
        // 40px to match the map's control buttons, which the widget sizes up from Mapbox's 29px.
        className={`absolute left-2.5 top-2.5 z-10 h-10 w-10 overflow-hidden rounded p-[0.3rem] shadow-[0_0_0_2px_rgba(0,0,0,0.1)] ${BUTTON_CHROME}`}
        title="View the national danger map on Avalanche.org"
      >
        <Image
          src="/images/avalanche-org.png"
          alt=""
          width={512}
          height={512}
          className="h-full w-full"
          aria-hidden="true"
        />
        <span className="sr-only">View the national danger map on Avalanche.org</span>
      </a>

      <div ref={recenterRef} className="mapboxgl-ctrl mapboxgl-ctrl-group overflow-hidden">
        <button
          type="button"
          onClick={onRecenter}
          // Size comes from Mapbox's control-group CSS; centering the icon in whatever box that
          // produces is more robust than asserting a size of our own.
          className={`h-full w-full ${BUTTON_CHROME}`}
          title="Re-center the map"
        >
          <RotateCw className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span className="sr-only">Re-center the map</span>
        </button>
      </div>
    </>
  )
}
