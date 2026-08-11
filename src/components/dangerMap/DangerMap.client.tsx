'use client'

/**
 * The native avalanche danger map.
 *
 * Mapbox GL only runs in a browser, so this is a client component and it fetches its zones on
 * mount rather than receiving them from the (statically generated) home page. That matches the
 * legacy widget, which refetched on every page load — a map is worth having only if the ratings on
 * it are current.
 *
 * The imperative work lives in `./useDangerMap` (construction, data, layers, flash, pointer) and
 * the source and paint definitions in `./zoneLayers`; what's left here is layout.
 */
import type { RefObject } from 'react'
import { useCallback, useMemo, useRef } from 'react'

import { mapboxZoomFor, type DangerMapSettings } from '@/services/nac/dangerMap/dangerMapSettings'
import { featuresToFit, zoneBounds } from '@/services/nac/dangerMap/dangerMapZones'

import { DangerMapControls } from './DangerMapControls'
import { ZoneList } from './ZoneList'
import { ZonePopupCard } from './ZonePopupCard'
import {
  useMapInstance,
  useWarningFlash,
  useZoneData,
  useZoneInteractions,
  useZoneLayers,
  type HoveredZone,
  type ZoneCollection,
} from './useDangerMap'

const POPUP_WIDTH = 300

/**
 * Re-positions Mapbox's top-left control corner so the search box sits centered over the map, as
 * it does in the widget, rather than stacked in the corner where it would collide with the
 * avalanche.org link. Insets of 60px clear that link on the left and the zoom controls on the
 * right; `float-none` undoes the corner's own left-float so `mx-auto` can take effect.
 */
const SEARCH_BOX_LAYOUT = [
  '[&_.mapboxgl-ctrl-top-left]:left-[60px]',
  '[&_.mapboxgl-ctrl-top-left]:right-[60px]',
  // `!` is needed on these two: mapbox-gl.css sets `float: left` and a left margin on its corner
  // children at equal specificity, and it wins on load order.
  '[&_.mapboxgl-ctrl-top-left_>_*]:!float-none',
  '[&_.mapboxgl-ctrl-top-left_>_*]:!mx-auto',
  '[&_.mapboxgl-ctrl-top-left_>_*]:block',
  '[&_.mapboxgl-ctrl-top-left_>_*]:max-w-[400px]',
].join(' ')

/** Padding for fitBounds — extra on top so the search box doesn't cover the northernmost zone. */
const FIT_PADDING = { top: 60, bottom: 20, left: 20, right: 20 }

export interface DangerMapProps {
  centerSlug: string
  /** The center's upstream id (e.g. `NWAC`), used to decide which links stay in this tab. */
  centerId: string
  settings: DangerMapSettings
}

export function DangerMap({ centerSlug, centerId, settings }: DangerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Mounted into Mapbox's top-right control stack.
  const recenterRef = useRef<HTMLDivElement>(null)

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const { zones, failed } = useZoneData(centerSlug, settings.allCenters)
  const mapRef = useMapInstance(containerRef, recenterRef, token, settings)

  /** Return to the configured viewport, or to a view that fits the center's own zones. */
  const recenter = useCallback(
    (animate: boolean) => {
      const map = mapRef.current
      if (!map) return

      if (settings.center) {
        map.flyTo({
          center: [settings.center.lng, settings.center.lat],
          zoom: mapboxZoomFor(settings.zoom),
          animate,
        })
        return
      }

      const bounds = zoneBounds(featuresToFit(zones, centerId))
      if (bounds) map.fitBounds(bounds, { padding: FIT_PADDING, animate })
    },
    [mapRef, centerId, settings.center, settings.zoom, zones],
  )

  useZoneLayers(mapRef, zones, () => recenter(false))
  useWarningFlash(mapRef, zones)
  // `centerId` rides along in the popup settings so the link rule lives in one place.
  const popupSettings = useMemo(() => ({ ...settings, centerId }), [settings, centerId])
  const hovered = useZoneInteractions(mapRef, zones, popupSettings)

  if (!token) {
    // Without a token Mapbox renders a blank grey box and logs an auth error; say so instead.
    return (
      <div className="flex h-full w-full items-center justify-center rounded border text-sm text-muted-foreground">
        The danger map is not configured for this site.
      </div>
    )
  }

  return (
    // Fills the height its server-rendered parent already reserved, so there is nothing to shift.
    <div className={`relative h-full w-full ${SEARCH_BOX_LAYOUT}`}>
      <div ref={containerRef} className="h-full w-full" />

      <DangerMapControls recenterRef={recenterRef} onRecenter={() => recenter(true)} />

      <HoverCard hovered={hovered} containerRef={containerRef} />

      <MapStatus zones={zones} failed={failed} />

      {/* The map itself is a canvas, so its content is unreachable by keyboard or screen reader.
          This is the same information as a list of links — visually hidden, but focusable. */}
      <ZoneList zones={zones} settings={popupSettings} />
    </div>
  )
}

/** The popup card, positioned to follow the cursor without leaving the map. */
function HoverCard({
  hovered,
  containerRef,
}: {
  hovered: HoveredZone | null
  containerRef: RefObject<HTMLDivElement | null>
}) {
  if (!hovered) return null

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        // Keep the card inside the map when the cursor is near the right-hand edge.
        left: Math.min(hovered.x, (containerRef.current?.offsetWidth ?? 0) - POPUP_WIDTH),
        top: hovered.y,
      }}
    >
      <ZonePopupCard popup={hovered.popup} />
    </div>
  )
}

/** Covers the map while the zones load, and stays up if they never arrive. */
function MapStatus({ zones, failed }: { zones: ZoneCollection | null; failed: boolean }) {
  if (failed) {
    return (
      <MapOverlay>
        <span>Avalanche danger is unavailable right now.</span>
      </MapOverlay>
    )
  }
  if (!zones) {
    return (
      <MapOverlay>
        <span>Loading avalanche danger…</span>
      </MapOverlay>
    )
  }
  return null
}

function MapOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">
      {children}
    </div>
  )
}
