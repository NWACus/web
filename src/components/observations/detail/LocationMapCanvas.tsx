'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'

import { MAP_STYLE } from '@/components/map/mapbox'

import type { LocationMapProps } from './LocationMap.client'

const ZOOM = 9

/** The widget's detail marker: a 16px dot in the marker color, numbered when over one. */
function markerElement(color: string, count: number | null): HTMLElement {
  const element = document.createElement('div')
  element.className = 'flex items-center justify-center'
  const dot = document.createElement('div')
  dot.className = 'h-4 w-4 rounded-full'
  dot.style.backgroundColor = color
  dot.style.border = '1px solid rgba(0, 0, 0, 0.2)'
  element.appendChild(dot)
  if (count !== null && count > 1) {
    const number = document.createElement('div')
    number.className = 'pointer-events-none absolute text-xs font-bold text-white'
    number.style.textShadow = '0 0 3px rgba(0, 0, 0, 0.8), 0 0 1px rgba(0, 0, 0, 0.8)'
    number.textContent = String(count)
    element.appendChild(number)
  }
  return element
}

export function LocationMapCanvas({
  location,
  color,
  label,
  count = null,
  token,
  className,
}: LocationMapProps & { token: string; className: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { lng, lat } = location

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    mapboxgl.accessToken = token
    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({
        container,
        style: MAP_STYLE,
        center: [lng, lat],
        zoom: ZOOM,
        interactive: false,
      })
    } catch {
      // No WebGL: the placeholder box stays, and the header fields still say where it was.
      return
    }
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right')
    new mapboxgl.Marker({ element: markerElement(color, count) }).setLngLat([lng, lat]).addTo(map)
    return () => map.remove()
  }, [token, lng, lat, color, count])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Map showing ${label}`}
      className={className}
      data-testid="location-map"
    />
  )
}
