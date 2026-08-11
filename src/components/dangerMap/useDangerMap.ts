'use client'

/**
 * The danger map's imperative pieces, one hook per concern.
 *
 * Mapbox is imperative and React is not, so the bridge is a set of effects that each own one
 * thing: building the map, fetching the zones, putting them on the map, animating warnings, and
 * tracking the pointer. Splitting them out keeps the component itself to layout and state.
 */
import { MapboxSearchBox } from '@mapbox/search-js-web'
import mapboxgl from 'mapbox-gl'
// Aliased: the unqualified `Map` would shadow the JS built-in used for the zone lookup below.
import type { Map as MapboxMap, MapMouseEvent, Point } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useRouter } from 'next/navigation'
import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

import { mapboxZoomFor, type DangerMapSettings } from '@/services/nac/dangerMap/dangerMapSettings'
import type { ZonePopup, ZoneRenderFeature } from '@/services/nac/dangerMap/dangerMapZones'
import { zonePopup, type ZonePopupSettings } from '@/services/nac/dangerMap/dangerMapZones'

import {
  FILL_LAYER_ID,
  FILL_PAINT,
  OUTLINE_LAYER_ID,
  OUTLINE_PAINT,
  SOURCE_ID,
  toMapboxCollection,
} from './zoneLayers'

/** The `avalanche-org` "AFP Custom" style, shared with afp-public-widgets and dashboard-v2. */
const MAP_STYLE = 'mapbox://styles/avalanche-org/cmg1bsw48002301pshwzoen5y'

/** Roughly the centre of the western US — only ever seen before the zones arrive. */
const FALLBACK_CENTER: [number, number] = [-114.7, 44]

export interface ZoneCollection {
  type: 'FeatureCollection'
  features: ZoneRenderFeature[]
}

type MapRef = RefObject<MapboxMap | null>

/** Hover popups are a pointer affordance; below this width the map is tap-to-open-forecast only. */
const POPUP_MIN_WIDTH = 768
/** Offset from the cursor, so the card never sits under the pointer it is following. */
const POPUP_CURSOR_OFFSET = 10

// The warning flash, rebuilt as a feature-state ramp. The widget runs a 50ms setInterval stepping
// fill-opacity by ±0.05 between 0.1 and 0.9 (~1.6s a cycle); this reproduces that rate on
// requestAnimationFrame so it pauses with the tab instead of burning a timer in the background.
const FLASH_MIN_OPACITY = 0.1
const FLASH_MAX_OPACITY = 0.9
const FLASH_CYCLE_MS = 1600
/** Repaint at the widget's ~20fps rather than every frame — the extra steps aren't visible. */
const FLASH_STEP_MS = 50

export interface HoveredZone {
  popup: ZonePopup
  x: number
  y: number
}

/**
 * Build the Mapbox map once, into `containerRef`, and tear it down on unmount.
 *
 * Settings are read at construction: a center's viewport and controls are editorial config that
 * changes between deploys, not between renders, so the map is not rebuilt when they change.
 */
export function useMapInstance(
  containerRef: RefObject<HTMLDivElement | null>,
  recenterRef: RefObject<HTMLDivElement | null>,
  token: string | undefined,
  settings: DangerMapSettings,
): MapRef {
  const mapRef = useRef<MapboxMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || !token) return

    const map = buildMap(containerRef.current, token, settings)
    mapRef.current = map

    // Added after the built-in controls, so Mapbox stacks it underneath them.
    if (recenterRef.current) map.addControl(asControl(recenterRef.current), 'top-right')

    return () => {
      mapRef.current = null
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return mapRef
}

/**
 * Hand an existing React-rendered node to Mapbox as a control.
 *
 * `onRemove` deliberately does nothing: React created the node and React unmounts it, so detaching
 * it here too would be a double removal. Mapbox only needs to be told where to put it.
 */
function asControl(element: HTMLElement): mapboxgl.IControl {
  return { onAdd: () => element, onRemove: () => {} }
}

function buildMap(
  container: HTMLDivElement,
  token: string,
  settings: DangerMapSettings,
): MapboxMap {
  mapboxgl.accessToken = token

  const map = new mapboxgl.Map({
    container,
    style: MAP_STYLE,
    center: settings.center ? [settings.center.lng, settings.center.lat] : FALLBACK_CENTER,
    zoom: mapboxZoomFor(settings.zoom),
    // Scroll-zoom only with a modifier, so the map never hijacks a page scroll.
    cooperativeGestures: true,
  })

  // Rotation and pitch add nothing to a polygon map and make it easy to get lost.
  map.dragRotate.disable()
  map.touchPitch.disable()
  map.touchZoomRotate.disableRotation()
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

  if (settings.geolocate) {
    map.addControl(
      new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
      'top-right',
    )
  }

  if (settings.search) {
    // Mapbox mounts it; SEARCH_BOX_LAYOUT in the component re-positions the corner it lands in.
    // Letting Mapbox own the mounting sidesteps @mapbox/search-js-web's element type, which
    // narrows addEventListener in a way that makes it unassignable to `Node` (so `appendChild`
    // rejects it).
    map.addControl(buildSearchBox(map, token), 'top-left')
  }

  return map
}

/** The Mapbox search box, configured as the legacy widget configures it. */
function buildSearchBox(map: MapboxMap, token: string): MapboxSearchBox {
  const searchBox = new MapboxSearchBox()
  searchBox.accessToken = token
  searchBox.options = {
    limit: 5,
    types: 'place,city,poi',
    poi_category: 'mountain,tourist_attraction,outdoors,park,lake',
    country: 'US',
    proximity: map.getCenter().toArray(),
  }
  searchBox.placeholder = 'Search for a location...'
  searchBox.mapboxgl = mapboxgl
  searchBox.marker = { color: '#d9534f' }
  return searchBox
}

/**
 * Fetch the center's zones, pre-styled, on mount.
 *
 * The host page is statically generated on a long window; fetching here rather than taking the
 * zones as props is what keeps the ratings current, exactly as the legacy widget's fetch-per-page
 * -load did.
 */
export function useZoneData(centerSlug: string, allCenters: boolean) {
  const [zones, setZones] = useState<ZoneCollection | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const query = allCenters ? '?allCenters=true' : ''

    fetch(`/api/${centerSlug}/danger-map${query}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: ZoneCollection) => setZones(data))
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return
        setFailed(true)
      })

    return () => controller.abort()
  }, [centerSlug, allCenters])

  return { zones, failed }
}

/** Put the zones on the map once both the style and the data are ready, and frame them. */
export function useZoneLayers(mapRef: MapRef, zones: ZoneCollection | null, onReady: () => void) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !zones) return

    const addZoneLayers = () => {
      if (map.getSource(SOURCE_ID)) return

      map.addSource(SOURCE_ID, { type: 'geojson', data: toMapboxCollection(zones.features) })
      map.addLayer({ id: FILL_LAYER_ID, type: 'fill', source: SOURCE_ID, paint: FILL_PAINT })
      map.addLayer({ id: OUTLINE_LAYER_ID, type: 'line', source: SOURCE_ID, paint: OUTLINE_PAINT })

      onReady()
    }

    // The data usually arrives before the style finishes; handle either order.
    if (map.isStyleLoaded()) addZoneLayers()
    else map.once('load', addZoneLayers)

    return () => {
      if (!map.getSource(SOURCE_ID)) return
      for (const id of [FILL_LAYER_ID, OUTLINE_LAYER_ID]) {
        if (map.getLayer(id)) map.removeLayer(id)
      }
      map.removeSource(SOURCE_ID)
    }
    // `onReady` frames the map from the zones this effect already depends on; re-running on its
    // identity alone would tear down and rebuild the layers on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef, zones])
}

/** Pulse the fill of any zone with an avalanche warning in effect. */
export function useWarningFlash(mapRef: MapRef, zones: ZoneCollection | null) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !zones) return

    // Collect ids rather than features: setFeatureState keys on the id, and a zone upstream sent
    // without one can't be addressed at all.
    const warnedIds = zones.features.flatMap((feature) =>
      feature.properties.hasWarning && feature.id != null ? [feature.id] : [],
    )
    if (warnedIds.length === 0) return

    const start = performance.now()
    let lastStep = 0
    let frame = requestAnimationFrame(function tick(now: number) {
      frame = requestAnimationFrame(tick)

      const elapsed = now - start
      if (elapsed - lastStep < FLASH_STEP_MS) return
      lastStep = elapsed

      // Triangle wave between the min and max opacity — ramp up for half a cycle, down for the
      // other half, which is what the widget's ±0.05-per-50ms stepping amounts to.
      const phase = (elapsed % FLASH_CYCLE_MS) / FLASH_CYCLE_MS
      const ramp = phase < 0.5 ? phase * 2 : (1 - phase) * 2
      const flashOpacity = FLASH_MIN_OPACITY + ramp * (FLASH_MAX_OPACITY - FLASH_MIN_OPACITY)

      for (const id of warnedIds) {
        map.setFeatureState({ source: SOURCE_ID, id }, { flashOpacity })
      }
    })

    return () => {
      cancelAnimationFrame(frame)
      if (!map.getSource(SOURCE_ID)) return
      for (const id of warnedIds) {
        // Drop the state rather than pinning a final opacity, so the zone falls back to the
        // fill-opacity baked into its own properties.
        map.removeFeatureState({ source: SOURCE_ID, id }, 'flashOpacity')
      }
    }
  }, [mapRef, zones])
}

/**
 * Track the pointer: thicken the hovered zone's outline, follow it with a popup, and open a zone's
 * forecast on click.
 */
export function useZoneInteractions(
  mapRef: MapRef,
  zones: ZoneCollection | null,
  settings: ZonePopupSettings,
) {
  const [hovered, setHovered] = useState<HoveredZone | null>(null)
  const router = useRouter()

  useEffect(() => {
    const map = mapRef.current
    if (!map || !zones) return

    const byId = new Map(zones.features.map((feature) => [String(feature.id), feature]))
    let hoveredId: string | number | null = null

    const dropHoverState = () => {
      if (hoveredId != null && map.getSource(SOURCE_ID)) {
        map.removeFeatureState({ source: SOURCE_ID, id: hoveredId }, 'hover')
      }
      hoveredId = null
    }

    const clearHover = () => {
      dropHoverState()
      map.getCanvas().style.cursor = ''
      setHovered(null)
    }

    /**
     * The zone under the pointer. `id` is the addressable feature id (what `setFeatureState`
     * keys on) and `zone` the matching data — null when upstream sent a zone we have no record
     * of, which can still be highlighted but has nothing to say in a popup.
     */
    const zoneUnderPointer = (point: Point) => {
      const feature = map.queryRenderedFeatures(point, { layers: [FILL_LAYER_ID] })[0]
      if (!feature || feature.id == null) return null
      return { id: feature.id, zone: byId.get(String(feature.id)) ?? null }
    }

    /** Move the hover highlight to `id`, if it isn't already there. */
    const markHovered = (id: string | number) => {
      if (hoveredId === id) return
      dropHoverState()
      hoveredId = id
      map.setFeatureState({ source: SOURCE_ID, id }, { hover: true })
    }

    /**
     * The hover card for a zone, or null when there shouldn't be one. Popups are desktop-only in
     * the legacy widget; a card that follows the cursor has nowhere to go on a phone.
     */
    const hoverCardFor = (zone: ZoneRenderFeature | null, point: Point): HoveredZone | null => {
      if (!zone || window.innerWidth <= POPUP_MIN_WIDTH) return null
      return {
        popup: zonePopup(zone.properties, settings),
        x: point.x + POPUP_CURSOR_OFFSET,
        y: point.y + POPUP_CURSOR_OFFSET,
      }
    }

    const onMouseMove = (event: MapMouseEvent) => {
      const hit = zoneUnderPointer(event.point)
      if (!hit) {
        clearHover()
        return
      }

      map.getCanvas().style.cursor = 'pointer'
      markHovered(hit.id)

      // Leaves any existing card in place rather than clearing it: a zone we can highlight but
      // can't describe shouldn't blank the card the reader is currently reading.
      const card = hoverCardFor(hit.zone, event.point)
      if (card) setHovered(card)
    }

    const onClick = (event: MapMouseEvent) => {
      const zone = zoneUnderPointer(event.point)?.zone
      if (!zone) return

      // Same resolution the popup and the zone list use, so all three agree on where a zone goes.
      openZone(zonePopup(zone.properties, settings), router)
    }

    map.on('mousemove', onMouseMove)
    map.on('mouseout', clearHover)
    map.on('click', onClick)

    return () => {
      map.off('mousemove', onMouseMove)
      map.off('mouseout', clearHover)
      map.off('click', onClick)
      clearHover()
    }
  }, [mapRef, zones, settings, router])

  return hovered
}

/**
 * Follow a zone's forecast link. Another center's zones — only reachable on an all-centers map —
 * leave AvyWeb, so they open in a new tab rather than navigating the reader off the site.
 */
function openZone({ href, isExternal }: ZonePopup, router: AppRouterInstance) {
  if (!href) return
  if (isExternal) window.open(href, '_blank', 'noopener')
  else router.push(href)
}
