'use client'

/**
 * A React-rendered Mapbox marker.
 *
 * The legacy map's markers are DOM elements (Google Maps `CustomMarker`s), which is what lets a
 * marker be a labelled, rounded box with a wind arrow in it. Mapbox's `Marker` places a DOM
 * element the same way, and a portal lets React own what's inside it: the marker element is
 * created once, Mapbox positions it, and React renders the children into it.
 */
import type { Map as MapboxMap } from 'mapbox-gl'
import mapboxgl from 'mapbox-gl'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface MapMarkerProps {
  map: MapboxMap
  lngLat: [number, number]
  /** Raised for the selected marker so it sits above its neighbours, as the widget does. */
  raised?: boolean
  children: ReactNode
}

export function MapMarker({ map, lngLat, raised = false, children }: MapMarkerProps) {
  // Created in the initializer so the portal has a target on the first render.
  const [element] = useState(() => document.createElement('div'))

  useEffect(() => {
    const marker = new mapboxgl.Marker({ element, anchor: 'center' }).setLngLat(lngLat).addTo(map)
    return () => {
      marker.remove()
    }
  }, [map, element, lngLat])

  // Only the selected marker gets a z-index, and a small one: enough to clear its neighbours
  // (which stack in DOM order), and still under the info panel and legend laid over the map.
  useEffect(() => {
    element.style.zIndex = raised ? '1' : ''
  }, [element, raised])

  return createPortal(children, element)
}
