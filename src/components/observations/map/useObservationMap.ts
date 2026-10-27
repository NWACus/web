'use client'

/**
 * The observation map's instance, camera and viewport.
 *
 * The viewport is half of the list's query (inventory row O11): the list shows what is inside the
 * map. So the map reports its bounds once built and after every move or resize, 400ms after the
 * last as the widget debounces them, and a move under 0.0001° is not a move. It doesn't wait for
 * `idle`, which never comes if the basemap style fails to load — the list must still list.
 *
 * A move the viewer starts itself (framing a chosen zone) is announced first: until the map has
 * settled the viewport is `moving`, and the list waits for it rather than asking for the zone
 * within the old view and then again within the new one, as the widget waits.
 */
import type { Map as MapboxMap } from 'mapbox-gl'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { MAP_STYLE, asControl, disableRotation } from '@/components/map/mapbox'
import type { ObservationZoneOption } from '@/services/nac/model/observation'
import type { BBox } from '@/services/nac/observations/listParams'
import type { ObservationViewerSettings } from '@/services/nac/observations/viewerSettings'
import { type Bounds } from '@/utilities/geo/bounds'

const BOUNDS_DEBOUNCE_MS = 400
const BOUNDS_EPSILON = 0.0001
/** A move that never reports (cancelled, or already in place) stops holding the list after this. */
const MOVE_TIMEOUT_MS = 3000
/** The widget frames a chosen zone with 50px to spare. */
const ZONE_PADDING = 50
/** The widget's layout switches to its phone view under 992px, and narrows the camera there. */
export const PHONE_WIDTH = 992
const WIDE_WIDTH = 1400

export interface Camera {
  center: [number, number]
  zoom: number
}

/** One zoom level out on a phone, and a little in on a wide screen, as the widget adjusts it. */
function responsiveZoom(zoom: number, width: number): number {
  if (width < PHONE_WIDTH) return zoom - 1
  if (width > WIDE_WIDTH) return zoom + (width / WIDE_WIDTH) * 0.4
  return zoom
}

/** The configured camera for this screen, or null when the center configures none. */
export function openingCamera(settings: ObservationViewerSettings, width: number): Camera | null {
  const { mapCenter, mapZoom } = settings
  if (!mapCenter || mapZoom === null) return null
  return { center: [mapCenter.lng, mapCenter.lat], zoom: responsiveZoom(mapZoom, width) }
}

/** The box around a set of zones, or null. */
export function boundsOfZones(zones: ObservationZoneOption[]): Bounds | null {
  const boxes = zones.flatMap((zone) => (zone.bounds ? [zone.bounds] : []))
  if (boxes.length === 0) return null
  return boxes.reduce<Bounds>(
    ([[w, s], [e, n]], [[w2, s2], [e2, n2]]) => [
      [Math.min(w, w2), Math.min(s, s2)],
      [Math.max(e, e2), Math.max(n, n2)],
    ],
    boxes[0],
  )
}

export function bboxOf(bounds: Bounds): BBox {
  const [[west, south], [east, north]] = bounds
  return [west, south, east, north]
}

function sameBBox(a: BBox | null, b: BBox): boolean {
  return a !== null && a.every((value, index) => Math.abs(value - b[index]) < BOUNDS_EPSILON)
}

function currentBBox(map: MapboxMap): BBox {
  const bounds = map.getBounds()
  if (!bounds) return [0, 0, 0, 0]
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
}

export interface ObservationMapRefs {
  containerRef: RefObject<HTMLDivElement | null>
  controlsRef: RefObject<HTMLDivElement | null>
}

/** Where a map with no configured camera opens, until its zones frame it: the western US. */
const FALLBACK_CAMERA: Camera = { center: [-110, 44], zoom: 4 }

function buildMap(container: HTMLDivElement, token: string, camera: Camera): MapboxMap {
  mapboxgl.accessToken = token
  const map = new mapboxgl.Map({
    container,
    style: MAP_STYLE,
    center: camera.center,
    zoom: camera.zoom,
    // Scroll-zoom only with a modifier, so the map never hijacks a page scroll.
    cooperativeGestures: true,
    // One world, so the viewport the list is asked for is always the one the markers are drawn in.
    renderWorldCopies: false,
  })
  disableRotation(map)
  return map
}

/** The widget's top-right stack: its own reset (and expand) buttons, then zoom in and out. */
function addControls(map: MapboxMap, controls: HTMLElement | null) {
  if (controls) map.addControl(asControl(controls), 'top-right')
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
}

/**
 * Build the map with its controls, at the configured camera or framed on the center's zones.
 * Null when Mapbox refuses to start — it throws at construction without WebGL.
 */
function createMap(
  container: HTMLDivElement,
  token: string,
  settings: ObservationViewerSettings,
  controls: HTMLElement | null,
): MapboxMap | null {
  const camera = openingCamera(settings, window.innerWidth)
  let map: MapboxMap
  try {
    map = buildMap(container, token, camera ?? FALLBACK_CAMERA)
  } catch {
    return null
  }
  addControls(map, controls)
  if (!camera) fitZones(map, settings.zones, false)
  return map
}

/**
 * Build the map once and report its viewport. A center with no configured camera is framed on its
 * zones once they are known. Mapbox refusing to start (no WebGL) is `unsupported`, and the viewer
 * then lists what is in the center's zones instead.
 */
export function useObservationMap(
  { containerRef, controlsRef }: ObservationMapRefs,
  token: string | null,
  settings: ObservationViewerSettings,
) {
  const [map, setMap] = useState<MapboxMap | null>(null)
  const [unsupported, setUnsupported] = useState(false)
  const [bbox, setBBox] = useState<BBox | null>(null)
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // No token, or no WebGL: say so, and list the center's zones in place of a viewport.
    const instance = token ? createMap(container, token, settings, controlsRef.current) : null
    if (!instance) {
      setUnsupported(true)
      return
    }
    setMap(instance)
    return () => {
      setMap(null)
      instance.remove()
    }
    // Built once; the camera is only where it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])
  const styleStatus = useStyleStatus(map)

  useViewport(map, setBBox, setMoving)
  useMoveTimeout(moving, setMoving)

  // Without a map there is no viewport; the center's zones stand in for it, so the list still lists.
  const fallbackBBox = unsupported ? fallbackViewport(settings) : null
  return {
    map,
    styleReady: styleStatus === 'ready',
    styleFailed: styleStatus === 'failed',
    unsupported,
    bbox: fallbackBBox ?? bbox,
    moving: moving && !fallbackBBox,
    expectMove: useCallback(() => setMoving(true), []),
  }
}

function useMoveTimeout(moving: boolean, setMoving: (moving: boolean) => void) {
  useEffect(() => {
    if (!moving) return
    const timer = window.setTimeout(() => setMoving(false), MOVE_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [moving, setMoving])
}

type StyleStatus = 'loading' | 'ready' | 'failed'

/**
 * Whether the style has loaded, so layers can be added, or failed to (a blocked or rate-limited
 * Mapbox). Tracked from `style.load` rather than asked of `isStyleLoaded()`, which also reports
 * false while tiles are merely in flight. The map is built in the same commit this subscribes in,
 * and its style arrives over the network, so the event cannot have fired yet.
 */
function useStyleStatus(map: MapboxMap | null): StyleStatus {
  const [status, setStatus] = useState<StyleStatus>('loading')
  useEffect(() => {
    if (!map) return
    const onLoad = () => {
      map.off('error', onError)
      setStatus('ready')
    }
    const onError = () => setStatus('failed')
    map.once('style.load', onLoad)
    map.on('error', onError)
    return () => {
      map.off('style.load', onLoad)
      map.off('error', onError)
      setStatus('loading')
    }
  }, [map])
  return status
}

function fallbackViewport(settings: ObservationViewerSettings): BBox | null {
  const bounds = boundsOfZones(settings.zones)
  if (bounds) return bboxOf(bounds)
  const center = settings.mapCenter
  return center ? [center.lng - 2, center.lat - 2, center.lng + 2, center.lat + 2] : null
}

function useViewport(
  map: MapboxMap | null,
  setBBox: (update: (b: BBox | null) => BBox) => void,
  setMoving: (moving: boolean) => void,
) {
  useEffect(() => {
    if (!map) return
    let timer: number | undefined
    const report = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        // Mid-flight, the move's own `moveend` will report where it lands.
        if (map.isMoving()) return
        const next = currentBBox(map)
        setBBox((current) => (sameBBox(current, next) ? (current ?? next) : next))
        setMoving(false)
      }, BOUNDS_DEBOUNCE_MS)
    }
    report()
    map.on('moveend', report)
    map.on('resize', report)
    return () => {
      window.clearTimeout(timer)
      map.off('moveend', report)
      map.off('resize', report)
    }
  }, [map, setBBox, setMoving])
}

/** Frame zones, as choosing one in the zone filter does; clearing the choice does not move the map. */
export function fitZones(map: MapboxMap, zones: ObservationZoneOption[], animate = true) {
  const bounds = boundsOfZones(zones)
  if (bounds) map.fitBounds(bounds, { padding: ZONE_PADDING, animate })
}

/**
 * The reset control: back to the chosen zones when there are some, else the opening camera (or,
 * for a center without one, all its zones).
 */
export function useResetView(
  map: MapboxMap | null,
  settings: ObservationViewerSettings,
  chosenZones: ObservationZoneOption[],
) {
  const chosenRef = useRef(chosenZones)
  chosenRef.current = chosenZones
  return useCallback(() => {
    if (!map) return
    if (chosenRef.current.length > 0) {
      fitZones(map, chosenRef.current)
      return
    }
    const camera = openingCamera(settings, window.innerWidth)
    if (camera) map.jumpTo(camera)
    else fitZones(map, settings.zones)
  }, [map, settings])
}
