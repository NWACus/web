'use client'

/**
 * PROTOTYPE ONLY — a configurable copy of the native danger map (issue #1312) so each variant can
 * change the camera, terrain and decorations without touching the production `DangerMap`.
 * Reuses the production popup, warning flash and pointer hooks. No search box.
 */
import type { Map as MapboxMap } from 'mapbox-gl'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'

import { mapboxZoomFor, type DangerMapSettings } from '@/services/nac/dangerMap/dangerMapSettings'
import { featuresToFit, zoneBounds } from '@/services/nac/dangerMap/dangerMapZones'

import { DangerMapControls } from '../DangerMapControls'
import { ZonePopupCard } from '../ZonePopupCard'
import { useWarningFlash, useZoneInteractions, type ZoneCollection } from '../useDangerMap'
import {
  FILL_LAYER_ID,
  FILL_PAINT,
  OUTLINE_LAYER_ID,
  OUTLINE_PAINT,
  SOURCE_ID,
  toMapboxCollection,
} from '../zoneLayers'

const MAP_STYLE = 'mapbox://styles/avalanche-org/cmg1bsw48002301pshwzoen5y'
const DEM_SOURCE_ID = 'proto-dem'

export interface MapLook {
  pitch: number
  bearing: number
  /** Drape the zones over 3D terrain. */
  terrain: boolean
  /** Atmospheric fog, which fades the far distance in a pitched view. */
  fog: boolean
  /** `configured` uses the center's dashboard viewport; `fit` frames its own zones. */
  frame: 'configured' | 'fit'
  padding: { top: number; bottom: number; left: number; right: number }
  /** How much of the tilt's foreshortening to spend on zooming in (0–1). */
  tiltZoom: number
}

export const FLAT_LOOK: MapLook = {
  pitch: 0,
  bearing: 0,
  terrain: false,
  fog: false,
  frame: 'configured',
  padding: { top: 60, bottom: 20, left: 20, right: 20 },
  tiltZoom: 0,
}

interface PrototypeMapProps {
  zones: ZoneCollection | null
  centerId: string
  settings: DangerMapSettings
  look: MapLook
  /** Extra layers/markers, added once the zones are on the map; return a cleanup. */
  decorate?: (map: MapboxMap, zones: ZoneCollection) => () => void
  onMap?: (map: MapboxMap | null) => void
  onHoverZone?: (zoneName: string | null) => void
  children?: ReactNode
}

export function PrototypeMap({
  zones,
  centerId,
  settings,
  look,
  decorate,
  onMap,
  onHoverZone,
  children,
}: PrototypeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const recenterRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const decorateRef = useRef(decorate)
  decorateRef.current = decorate
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const frame = useCallback(
    (animate: boolean) => {
      const map = mapRef.current
      if (!map) return
      const { pitch, bearing, padding } = look
      if (look.frame === 'configured' && settings.center) {
        map.flyTo({
          center: [settings.center.lng, settings.center.lat],
          zoom: mapboxZoomFor(settings.zoom),
          pitch,
          bearing,
          animate,
        })
        return
      }
      const bounds = zoneBounds(featuresToFit(zones, centerId))
      if (!bounds) return
      // Fit flat, then tilt: pitching foreshortens north-south by cos(pitch), so zoom in to match.
      const flat = map.cameraForBounds(bounds, { padding, bearing, pitch: 0 })
      if (!flat) return
      const boost = pitch > 0 ? -Math.log2(Math.cos((pitch * Math.PI) / 180)) * look.tiltZoom : 0
      map.easeTo({ ...flat, zoom: (flat.zoom ?? 6) + boost, pitch, bearing, animate })
    },
    [look, settings.center, settings.zoom, zones, centerId],
  )
  const frameRef = useRef(frame)
  frameRef.current = frame

  useEffect(() => {
    if (!containerRef.current || !token) return
    mapboxgl.accessToken = token
    const is3d = look.pitch > 0 || look.terrain

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: settings.center ? [settings.center.lng, settings.center.lat] : [-121.5, 47.3],
      zoom: mapboxZoomFor(settings.zoom),
      pitch: look.pitch,
      bearing: look.bearing,
      cooperativeGestures: true,
    })
    mapRef.current = map

    if (!is3d) {
      map.dragRotate.disable()
      map.touchPitch.disable()
      map.touchZoomRotate.disableRotation()
    }
    map.addControl(new mapboxgl.NavigationControl({ showCompass: is3d }), 'top-right')
    if (settings.geolocate) {
      map.addControl(new mapboxgl.GeolocateControl({}), 'top-right')
    }
    if (recenterRef.current) {
      const element = recenterRef.current
      map.addControl({ onAdd: () => element, onRemove: () => {} }, 'top-right')
    }

    map.on('style.load', () => {
      if (look.terrain) {
        map.addSource(DEM_SOURCE_ID, {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        })
        map.setTerrain({ source: DEM_SOURCE_ID, exaggeration: 3 })
      }
      if (look.fog) {
        map.setFog({
          range: [0.8, 8],
          color: '#ffffff',
          'high-color': '#cfe3f5',
          'horizon-blend': 0.2,
          'space-color': '#e9f2fb',
          'star-intensity': 0,
        })
      }
    })

    onMap?.(map)
    return () => {
      onMap?.(null)
      mapRef.current = null
      // The shared hooks' cleanups run after this one and still touch the canvas.
      queueMicrotask(() => map.remove())
    }
    // Built once per mount; variants remount via `key` to change the look.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !zones) return
    let undecorate: (() => void) | undefined

    const addZoneLayers = () => {
      if (map.getSource(SOURCE_ID)) return
      map.addSource(SOURCE_ID, { type: 'geojson', data: toMapboxCollection(zones.features) })
      map.addLayer({ id: FILL_LAYER_ID, type: 'fill', source: SOURCE_ID, paint: FILL_PAINT })
      map.addLayer({ id: OUTLINE_LAYER_ID, type: 'line', source: SOURCE_ID, paint: OUTLINE_PAINT })
      frameRef.current(false)
      undecorate = decorateRef.current?.(map, zones)
    }

    if (map.isStyleLoaded()) addZoneLayers()
    else map.once('load', addZoneLayers)

    return () => {
      try {
        undecorate?.()
      } catch {
        // The map may already be gone on unmount.
      }
      if (mapRef.current !== map || !map.getSource(SOURCE_ID)) return
      // Remove every layer on the zone source, including ones a variant added.
      for (const layer of map.getStyle()?.layers ?? []) {
        if ('source' in layer && layer.source === SOURCE_ID) map.removeLayer(layer.id)
      }
      map.removeSource(SOURCE_ID)
    }
  }, [zones])

  useWarningFlash(mapRef, zones)
  const popupSettings = useMemo(() => ({ ...settings, centerId }), [settings, centerId])
  const hovered = useZoneInteractions(mapRef, zones, popupSettings)
  const hoveredName = hovered?.popup.zoneName ?? null
  useEffect(() => onHoverZone?.(hoveredName), [hoveredName, onHoverZone])

  if (!token) return <div className="p-4 text-sm">No NEXT_PUBLIC_MAPBOX_TOKEN.</div>

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />
      <DangerMapControls recenterRef={recenterRef} onRecenter={() => frame(true)} />
      {children}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: Math.min(hovered.x, (containerRef.current?.offsetWidth ?? 0) - 300),
            top: Math.min(hovered.y, (containerRef.current?.offsetHeight ?? 0) - 180),
          }}
        >
          <ZonePopupCard popup={hovered.popup} />
        </div>
      )}
      {!zones && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white text-sm text-muted-foreground opacity-80">
          Loading avalanche danger…
        </div>
      )}
    </div>
  )
}

/** Put a DOM label on the map; returns its remover. */
export function addLabel(
  map: MapboxMap,
  lngLat: [number, number],
  element: HTMLElement,
): () => void {
  const marker = new mapboxgl.Marker({ element }).setLngLat(lngLat).addTo(map)
  return () => marker.remove()
}
