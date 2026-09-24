'use client'

/**
 * The forecast-zone outlines under the markers, from the center's map layer — every NAC center's
 * when the center shows all zones (the widget's default). They come from the danger map's own
 * endpoint, which already serves exactly that layer, edge-cached.
 *
 * Orientation, not data: if the layer fails to load the map simply has no outlines.
 */
import type { Map as MapboxMap } from 'mapbox-gl'
import { useEffect, useState } from 'react'

import { hasSource } from '@/components/map/mapbox'
import { isRecord } from '@/utilities/isRecord'

import { MARKER_LAYER_ID } from './useMarkerLayers'

const SOURCE_ID = 'observation-zones'
const FILL_ID = 'observation-zones-fill'
const LINE_ID = 'observation-zones-line'

type FeatureCollection = GeoJSON.FeatureCollection

function isFeatureCollection(value: unknown): value is FeatureCollection {
  return isRecord(value) && value.type === 'FeatureCollection' && Array.isArray(value.features)
}

function useZoneLayer(centerSlug: string, allZones: boolean) {
  const [layer, setLayer] = useState<FeatureCollection | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/${centerSlug}/danger-map?allCenters=${allZones}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: unknown) => setLayer(isFeatureCollection(body) ? body : null))
      .catch(() => {})
    return () => controller.abort()
  }, [centerSlug, allZones])
  return layer
}

/** The widget's neutral grey: this is a map of observations, and the zones are for orientation. */
function addZoneLayers(map: MapboxMap, layer: FeatureCollection) {
  map.addSource(SOURCE_ID, { type: 'geojson', data: layer })
  // Beneath the markers, whichever arrives first.
  const beneath = map.getLayer(MARKER_LAYER_ID) ? MARKER_LAYER_ID : undefined
  map.addLayer(
    {
      id: FILL_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: { 'fill-color': '#333333', 'fill-opacity': 0.1 },
    },
    beneath,
  )
  map.addLayer(
    {
      id: LINE_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: { 'line-color': '#333333', 'line-width': 2 },
    },
    beneath,
  )
}

function removeZoneLayers(map: MapboxMap) {
  if (!hasSource(map, SOURCE_ID)) return
  for (const id of [LINE_ID, FILL_ID]) {
    if (map.getLayer(id)) map.removeLayer(id)
  }
  map.removeSource(SOURCE_ID)
}

export function useZoneOutlines(
  map: MapboxMap | null,
  styleReady: boolean,
  centerSlug: string,
  allZones: boolean,
) {
  const layer = useZoneLayer(centerSlug, allZones)

  useEffect(() => {
    if (!map || !styleReady || !layer) return
    addZoneLayers(map, layer)
    return () => removeZoneLayers(map)
  }, [map, styleReady, layer])
}
