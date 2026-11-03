'use client'

/**
 * Hovering, clicking and tapping markers, as the widget handles them: on a desktop a hover shows
 * the marker's card and raises it, and a click opens the record; in the phone layout (under `lg`) a tap
 * shows the card with a link to open the record, since there is no hover to preview with.
 *
 * Where markers overlap, an observation with avalanches wins, so the most significant report is
 * the one a reader reaches.
 */
import type { GeoJSONFeature, MapMouseEvent, Map as MapboxMap } from 'mapbox-gl'
import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'

import type { ObservationKind } from '@/services/nac/model/observation'

import { isSideBySide } from '../sideBySide'
import type { MarkerProperties } from './MarkerPopup'
import { MARKER_LAYER_ID } from './useMarkerLayers'

/** How far from a marker's center the pointer can be and still be on it, as in the widget. */
const HIT_SLOP_PX = 5

export interface OpenPopup {
  id: string
  properties: MarkerProperties
  /** A tap's card stays until dismissed and carries a link; a hover's follows the pointer. */
  tapped: boolean
}

interface Marker {
  id: string
  properties: MarkerProperties
  point: [number, number]
}

const isPhone = () => !isSideBySide()

function toMarker(feature: GeoJSONFeature): Marker | null {
  const properties: MarkerProperties = feature.properties ?? {}
  const { id } = properties
  if (typeof id !== 'string' || feature.geometry.type !== 'Point') return null
  const [lng, lat] = feature.geometry.coordinates
  return { id, properties, point: [lng, lat] }
}

function markerAt(map: MapboxMap, event: MapMouseEvent): Marker | null {
  if (!map.getLayer(MARKER_LAYER_ID)) return null
  const { x, y } = event.point
  const box: [[number, number], [number, number]] = [
    [x - HIT_SLOP_PX, y - HIT_SLOP_PX],
    [x + HIT_SLOP_PX, y + HIT_SLOP_PX],
  ]
  const features = map.queryRenderedFeatures(box, { layers: [MARKER_LAYER_ID] })
  const preferred = features.find((feature) => feature.properties?.avalanches_observed === true)
  const feature = preferred ?? features[0]
  return feature ? toMarker(feature) : null
}

interface MarkerInteractionsOptions {
  map: MapboxMap | null
  kind: ObservationKind
  onOpen: (id: string) => void
  onHighlight: (id: string | null) => void
}

type Handlers = Pick<MarkerInteractionsOptions, 'onOpen' | 'onHighlight'>

/** The popup's lifecycle on one map: show a marker's card, hide it, and what each gesture does. */
function bindInteractions(
  map: MapboxMap,
  popup: mapboxgl.Popup,
  setPopup: (popup: OpenPopup | null) => void,
  handlers: { current: Handlers },
) {
  // Mousemove fires continuously; only a change of marker is worth a render.
  let shownId: string | null = null
  const show = (marker: Marker, tapped: boolean) => {
    if (marker.id === shownId && !tapped) return
    shownId = marker.id
    popup.setLngLat(marker.point).addTo(map)
    setPopup({ id: marker.id, properties: marker.properties, tapped })
    handlers.current.onHighlight(marker.id)
  }
  const hide = () => {
    if (shownId === null) return
    shownId = null
    popup.remove()
    setPopup(null)
    handlers.current.onHighlight(null)
    map.getCanvas().style.cursor = ''
  }
  const onMove = (event: MapMouseEvent) => {
    if (isPhone()) return
    const marker = markerAt(map, event)
    if (!marker) return hide()
    map.getCanvas().style.cursor = 'pointer'
    show(marker, false)
  }
  const onTap = (marker: Marker | null) => (marker ? show(marker, true) : hide())
  const onClick = (event: MapMouseEvent) => {
    const marker = markerAt(map, event)
    if (isPhone()) return onTap(marker)
    if (!marker) return
    hide()
    handlers.current.onOpen(marker.id)
  }
  map.on('mousemove', onMove)
  map.on('mouseout', hide)
  map.on('click', onClick)
  return () => {
    map.off('mousemove', onMove)
    map.off('mouseout', hide)
    map.off('click', onClick)
  }
}

export function useMarkerInteractions({
  map,
  kind,
  onOpen,
  onHighlight,
}: MarkerInteractionsOptions) {
  const [popup, setPopup] = useState<OpenPopup | null>(null)
  const [node] = useState(() => document.createElement('div'))
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const handlers = useRef<Handlers>({ onOpen, onHighlight })
  handlers.current = { onOpen, onHighlight }

  useEffect(() => {
    if (!map) return
    const instance = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: 'none',
      offset: 10,
    })
    instance.setDOMContent(node)
    popupRef.current = instance
    const unbind = bindInteractions(map, instance, setPopup, handlers)
    return () => {
      unbind()
      instance.remove()
      popupRef.current = null
    }
  }, [map, node])

  // A tab switch takes the marker away from under its card.
  useEffect(() => {
    popupRef.current?.remove()
    setPopup(null)
  }, [kind])

  return { popup, popupNode: node, closePopup: () => popupRef.current?.remove() }
}
