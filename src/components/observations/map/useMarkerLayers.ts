'use client'

/**
 * The markers: one vector-tile source per tab, drawn as circles in the widget's colors, with a
 * second, larger circle layer for the marker under the pointer or the card being hovered.
 *
 * Tiles come through `/api/<center>/observations/…/tiles` (see `observationRoutes.ts` for why they
 * are proxied), and carry only the dates: a date change swaps the source, and every other filter
 * is `tileFilter`, applied with `setFilter` so the tiles already loaded are reused.
 */
import type { ExpressionSpecification, Map as MapboxMap } from 'mapbox-gl'
import { useEffect, useState } from 'react'

import { hasSource, isLive } from '@/components/map/mapbox'
import type { ObservationKind } from '@/services/nac/model/observation'
import type { ObservationFilters } from '@/services/nac/observations/filters'
import { tabPath } from '@/services/nac/observations/routes'
import { tileDates, tileFilter } from '@/services/nac/observations/tileFilter'

import { AVALANCHE_COLOR, OBSERVATION_COLOR } from './markerStyle'

export const SOURCE_ID = 'observation-markers'
export const MARKER_LAYER_ID = 'observation-markers'
const HIGHLIGHT_LAYER_ID = 'observation-markers-highlight'
const COUNT_LAYER_ID = 'observation-markers-count'
/** The obs API's tiles hold markers to zoom 14; Mapbox overzooms past it. */
const TILE_MAX_ZOOM = 14

const NOTHING: ExpressionSpecification = ['==', ['get', 'id'], '']

function tileUrl(centerSlug: string, kind: ObservationKind, filters: ObservationFilters): string {
  const { from, to } = tileDates(filters)
  const params = new URLSearchParams({ startDate: from, endDate: to })
  // Mapbox fetches tiles from a worker, so the template must be absolute.
  return `${window.location.origin}/api/${centerSlug}${tabPath(kind)}/tiles/{z}/{x}/{y}?${params}`
}

/** 7px, 8.5px under the pointer; an avalanche report of several is a size up, as in the widget. */
function circleRadius(
  kind: ObservationKind,
  highlighted: boolean,
): ExpressionSpecification | number {
  const [single, several] = highlighted ? [8.5, 9.5] : [7, 8]
  if (kind === 'observation') return single
  return ['case', ['>', ['to-number', ['get', 'number'], 1], 1], several, single]
}

function circlePaint(kind: ObservationKind, highlighted: boolean) {
  return {
    'circle-radius': circleRadius(kind, highlighted),
    'circle-color': kind === 'avalanche' ? AVALANCHE_COLOR : OBSERVATION_COLOR,
    'circle-stroke-width': 1,
    'circle-stroke-color': 'rgba(0, 0, 0, 0.4)',
  }
}

function addLayers(
  map: MapboxMap,
  url: string,
  kind: ObservationKind,
  filter: ExpressionSpecification,
) {
  map.addSource(SOURCE_ID, { type: 'vector', tiles: [url], minzoom: 0, maxzoom: TILE_MAX_ZOOM })
  const common = { source: SOURCE_ID, 'source-layer': 'default' } as const
  map.addLayer({
    id: MARKER_LAYER_ID,
    type: 'circle',
    ...common,
    filter,
    paint: circlePaint(kind, false),
  })
  map.addLayer({
    id: HIGHLIGHT_LAYER_ID,
    type: 'circle',
    ...common,
    filter: NOTHING,
    paint: circlePaint(kind, true),
  })
  // A report of several avalanches carries its count, from zoom 6 up. Text needs the style's
  // glyphs, which a stripped-down style (as the e2e suite serves) doesn't have.
  if (kind === 'avalanche' && map.getStyle()?.glyphs) {
    map.addLayer({
      id: COUNT_LAYER_ID,
      type: 'symbol',
      ...common,
      filter: ['all', filter, ['>', ['to-number', ['get', 'number'], 1], 1]],
      layout: {
        'text-field': ['to-string', ['get', 'number']],
        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 6, 0, 8, 10],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0, 0, 0, 0.5)',
        'text-halo-width': 1,
      },
    })
  }
}

function removeLayers(map: MapboxMap) {
  if (!hasSource(map, SOURCE_ID)) return
  for (const id of [COUNT_LAYER_ID, HIGHLIGHT_LAYER_ID, MARKER_LAYER_ID]) {
    if (map.getLayer(id)) map.removeLayer(id)
  }
  map.removeSource(SOURCE_ID)
}

/** The map is up, its style is loaded, and it has the layer. */
function hasLayer(map: MapboxMap | null, styleReady: boolean, id: string): map is MapboxMap {
  return map !== null && styleReady && isLive(map) && map.getLayer(id) !== undefined
}

interface MarkerLayersOptions {
  map: MapboxMap | null
  styleReady: boolean
  centerSlug: string
  kind: ObservationKind
  filters: ObservationFilters
  centerId: string
  highlightedId: string | null
}

/** Returns whether the tile source has failed to load, so the map can say so. */
export function useMarkerLayers({
  map,
  styleReady,
  centerSlug,
  kind,
  filters,
  centerId,
  highlightedId,
}: MarkerLayersOptions): { tilesFailed: boolean } {
  const [tilesFailed, setTilesFailed] = useState(false)
  const url = map ? tileUrl(centerSlug, kind, filters) : null
  const filter = tileFilter(kind, filters, centerId)
  const filterKey = JSON.stringify(filter)

  // The source, rebuilt when the tab or the dates change.
  useEffect(() => {
    if (!map || !styleReady || !url) return
    setTilesFailed(false)
    addLayers(map, url, kind, filter)
    // A tile failure arrives as a map `error` carrying the source's id, which the types omit.
    const onError = (event: { error: Error }) => {
      if ('sourceId' in event && event.sourceId === SOURCE_ID) setTilesFailed(true)
    }
    map.on('error', onError)
    return () => {
      map.off('error', onError)
      removeLayers(map)
    }
    // The filter is applied below; it must not rebuild the source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, styleReady, url, kind])

  // Every other filter, without refetching tiles.
  useEffect(() => {
    if (!hasLayer(map, styleReady, MARKER_LAYER_ID)) return
    map.setFilter(MARKER_LAYER_ID, filter)
    if (map.getLayer(COUNT_LAYER_ID)) {
      map.setFilter(COUNT_LAYER_ID, ['all', filter, ['>', ['to-number', ['get', 'number'], 1], 1]])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, styleReady, filterKey])

  // The highlight also honors the filters, so hovering a card never raises a hidden marker.
  useEffect(() => {
    if (!hasLayer(map, styleReady, HIGHLIGHT_LAYER_ID)) return
    map.setFilter(
      HIGHLIGHT_LAYER_ID,
      highlightedId ? ['all', filter, ['==', ['get', 'id'], highlightedId]] : NOTHING,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, styleReady, highlightedId, url, filterKey])

  return { tilesFailed }
}
