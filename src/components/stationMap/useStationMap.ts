'use client'

/**
 * The station map's imperative pieces, one hook per concern: fetching the data, building the map,
 * and drawing the forecast-zone outlines. Markers are React components (`MapMarker`), so they
 * need no hook here.
 */
import mapboxgl from 'mapbox-gl'
// Aliased: the unqualified `Map` would shadow the JS built-in.
import type { Map as MapboxMap } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

import { MAP_STYLE, asControl, disableRotation } from '@/components/map/mapbox'
import type {
  StationMapData,
  StationMapUnits,
  StationMapZone,
} from '@/services/snowobs/stationMap/model'

export interface MapView {
  center: { lat: number; lng: number }
  zoom: number
}

// --- Data ----------------------------------------------------------------------------------------

async function fetchStationMapData(
  centerSlug: string,
  units: StationMapUnits,
  signal: AbortSignal,
): Promise<StationMapData> {
  const res = await fetch(`/api/${centerSlug}/station-map?units=${units}`, { signal })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

/**
 * Fetch the center's stations, webcams and zones on mount, and again when the units change.
 *
 * The host page is statically generated; fetching here rather than at build time is what keeps
 * the readings current, exactly as the legacy widget's fetch-per-page-load did. On a units change
 * the previous data stays on screen until the new data lands, as the widget left it.
 */
export function useStationMapData(centerSlug: string, units: StationMapUnits) {
  const [data, setData] = useState<StationMapData | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setFailed(false)

    fetchStationMapData(centerSlug, units, controller.signal)
      .then((body) => {
        setData(body)
        setLoading(false)
      })
      .catch((error) => {
        if (isAbort(error)) return
        setFailed(true)
        setLoading(false)
      })

    return () => controller.abort()
  }, [centerSlug, units])

  return { data, failed, loading }
}

// --- The map ---------------------------------------------------------------------------------

function buildMap(container: HTMLDivElement, token: string, view: MapView): MapboxMap {
  mapboxgl.accessToken = token
  const map = new mapboxgl.Map({
    container,
    style: MAP_STYLE,
    center: [view.center.lng, view.center.lat],
    zoom: view.zoom,
    // Scroll-zoom only with a modifier, so the map never hijacks a page scroll.
    cooperativeGestures: true,
  })
  disableRotation(map)
  return map
}

/** The widget's top-right stack, top to bottom: reset, fullscreen, zoom in, zoom out. */
function addControls(map: MapboxMap, reset: HTMLElement | null, fullscreenOf: HTMLElement | null) {
  if (reset) map.addControl(asControl(reset), 'top-right')
  map.addControl(new mapboxgl.FullscreenControl({ container: fullscreenOf }), 'top-right')
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
}

function viewOf(map: MapboxMap): MapView {
  const center = map.getCenter()
  return { center: { lat: center.lat, lng: center.lng }, zoom: map.getZoom() }
}

/**
 * Build the Mapbox map once, into `containerRef`, and tear it down on unmount.
 *
 * Returned as state rather than a ref so the marker components re-render once it exists — they
 * mount before the map does.
 *
 * `initialView` is read at construction only. Fullscreen takes `wrapperRef`, the element around
 * the map and its overlays, so the legend and info panel go fullscreen with it as they do in the
 * widget.
 */
export interface MapRefs {
  /** The element around the map and its overlays — what goes fullscreen. */
  wrapperRef: RefObject<HTMLDivElement | null>
  /** The element Mapbox draws into. */
  containerRef: RefObject<HTMLDivElement | null>
  /** The React-rendered reset button, handed to Mapbox as a control. */
  resetRef: RefObject<HTMLDivElement | null>
}

export interface MapInstance {
  map: MapboxMap | null
  /** The base style has loaded, so layers can be added. Markers don't need to wait for this. */
  styleReady: boolean
  /** Mapbox refused to start — no WebGL. The page must still say what it knows. */
  unsupported: boolean
}

export function useMapInstance(
  { wrapperRef, containerRef, resetRef }: MapRefs,
  token: string,
  initialView: MapView,
  onMoveEnd: (view: MapView) => void,
): MapInstance {
  const [map, setMap] = useState<MapboxMap | null>(null)
  const [styleReady, setStyleReady] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  // The latest callback, read from the one listener registered at construction.
  const onMoveEndRef = useRef(onMoveEnd)
  onMoveEndRef.current = onMoveEnd

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let instance: MapboxMap
    try {
      instance = buildMap(container, token, initialView)
    } catch {
      // Mapbox GL throws at construction when it can't get a WebGL context.
      setUnsupported(true)
      return
    }
    addControls(instance, resetRef.current, wrapperRef.current)
    instance.on('moveend', () => onMoveEndRef.current(viewOf(instance)))
    // Tracked as state rather than asked of the map later: `isStyleLoaded()` also reports false
    // while tiles are merely in flight, and `load` fires only once, so a layer effect that ran at
    // the wrong moment could wait for an event that had already happened.
    instance.once('style.load', () => setStyleReady(true))
    setMap(instance)

    return () => {
      setMap(null)
      setStyleReady(false)
      instance.remove()
    }
    // The view is the opening view only; a preference change must not rebuild the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return { map, styleReady, unsupported }
}

// --- Zone outlines -------------------------------------------------------------------------------

const ZONES_SOURCE_ID = 'station-map-zones'
const ZONES_FILL_LAYER_ID = 'station-map-zones-fill'
const ZONES_OUTLINE_LAYER_ID = 'station-map-zones-outline'

/** The widget's neutral grey: this is a map of stations, and the zones are for orientation. */
function addZoneLayers(map: MapboxMap, zones: StationMapZone[]) {
  if (map.getSource(ZONES_SOURCE_ID)) return
  map.addSource(ZONES_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: zones.map((zone) => ({
        type: 'Feature',
        geometry: zone.geometry,
        properties: { name: zone.name },
      })),
    },
  })
  map.addLayer({
    id: ZONES_FILL_LAYER_ID,
    type: 'fill',
    source: ZONES_SOURCE_ID,
    paint: { 'fill-color': '#333333', 'fill-opacity': 0.2 },
  })
  map.addLayer({
    id: ZONES_OUTLINE_LAYER_ID,
    type: 'line',
    source: ZONES_SOURCE_ID,
    paint: { 'line-color': '#333333', 'line-width': 2 },
  })
}

function removeZoneLayers(map: MapboxMap) {
  if (!map.getSource(ZONES_SOURCE_ID)) return
  for (const id of [ZONES_FILL_LAYER_ID, ZONES_OUTLINE_LAYER_ID]) {
    if (map.getLayer(id)) map.removeLayer(id)
  }
  map.removeSource(ZONES_SOURCE_ID)
}

/** Draw the forecast-zone outlines under the markers, once the style is there to draw on. */
export function useZoneOutline(
  map: MapboxMap | null,
  styleReady: boolean,
  zones: StationMapZone[],
) {
  useEffect(() => {
    if (!map || !styleReady || zones.length === 0) return
    addZoneLayers(map, zones)
    return () => removeZoneLayers(map)
  }, [map, styleReady, zones])
}

function isOnMarker(event: mapboxgl.MapMouseEvent): boolean {
  const target = event.originalEvent.target
  return target instanceof Element && target.closest('.mapboxgl-marker') !== null
}

/** A map click that wasn't on a marker. */
export function useMapBackgroundClick(map: MapboxMap | null, onClick: () => void) {
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick

  useEffect(() => {
    if (!map) return
    const handler = (event: mapboxgl.MapMouseEvent) => {
      if (!isOnMarker(event)) onClickRef.current()
    }
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [map])
}
