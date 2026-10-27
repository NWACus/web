'use client'

/**
 * The map's markers as text, as `ZoneList` does for the danger map: a canvas reaches no screen
 * reader, so the markers on screen are also published as a visually hidden list of links to each
 * record. Rebuilt when the map settles, from what it actually drew — the same records, filtered
 * the same way. Becomes visible on focus, so a keyboard user can see where they are.
 */
import type { GeoJSONFeature, Map as MapboxMap } from 'mapbox-gl'
import { useEffect, useState } from 'react'

import type { ObservationKind } from '@/services/nac/model/observation'

import { MARKER_LAYER_ID } from './useMarkerLayers'

/** Enough to be useful by ear; the list beside the map pages through the rest. */
const MAX_LISTED = 100

interface ListedMarker {
  id: string
  label: string
}

type Properties = Record<string, unknown>

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

/** "Kendall Lakes, 2026-03-15", with the size for an avalanche. */
function describe(kind: ObservationKind, properties: Properties): string {
  const place = stringOr(properties.location_name, 'Unnamed location')
  if (kind === 'observation') return `${place}, ${stringOr(properties.start_date, 'no date')}`
  const size = typeof properties.d_size === 'string' ? `, D${properties.d_size}` : ''
  return `${place}, ${stringOr(properties.date, 'no date')}${size}`
}

function listed(feature: GeoJSONFeature, kind: ObservationKind): ListedMarker | null {
  const properties: Properties = feature.properties ?? {}
  const id = stringOr(properties.id, '')
  return id ? { id, label: describe(kind, properties) } : null
}

/** Each marker once (a marker straddling tiles renders twice), up to the cap. */
function renderedMarkers(map: MapboxMap, kind: ObservationKind): ListedMarker[] {
  if (!map.getLayer(MARKER_LAYER_ID)) return []
  const byId = new Map<string, ListedMarker>()
  const features = map.queryRenderedFeatures({ layers: [MARKER_LAYER_ID] })
  for (const marker of features.map((feature) => listed(feature, kind))) {
    if (marker) byId.set(marker.id, marker)
  }
  return [...byId.values()].slice(0, MAX_LISTED)
}

interface MarkerListProps {
  map: MapboxMap | null
  kind: ObservationKind
  hrefFor: (id: string) => string
  onOpen: (id: string) => void
}

export function MarkerList({ map, kind, hrefFor, onOpen }: MarkerListProps) {
  const [markers, setMarkers] = useState<ListedMarker[]>([])

  useEffect(() => {
    if (!map) return
    const update = () => setMarkers(renderedMarkers(map, kind))
    map.on('idle', update)
    return () => {
      map.off('idle', update)
    }
  }, [map, kind])

  if (markers.length === 0) return null
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:bottom-2 focus-within:left-2 focus-within:z-20 focus-within:max-h-48 focus-within:overflow-auto focus-within:rounded focus-within:bg-white focus-within:p-2 focus-within:text-sm">
      <h3>{kind === 'observation' ? 'Observations' : 'Avalanches'} on the map</h3>
      <ul>
        {markers.map((marker) => (
          <li key={marker.id}>
            <a
              href={hrefFor(marker.id)}
              onClick={(event) => {
                event.preventDefault()
                onOpen(marker.id)
              }}
            >
              {marker.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
