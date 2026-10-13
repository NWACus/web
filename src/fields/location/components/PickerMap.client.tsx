'use client'

import { createProductMap } from '@/components/map/mapbox'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'

type Point = { latitude: number; longitude: number }

interface PickerMapProps {
  point: Point | null
  /** A new object flies the map to it at the zoom a placed pin opens at. */
  focus?: Point | null
  onPick: (point: Point) => void
}

// Roughly the western US, where every avalanche center sits.
const UNSET_VIEW: { center: [number, number]; zoom: number } = { center: [-114, 44], zoom: 3.5 }
const POINT_ZOOM = 13

function keepInView(map: mapboxgl.Map, lngLat: [number, number]) {
  if (map.getBounds()?.contains(lngLat)) return
  map.easeTo({ center: lngLat, zoom: Math.max(map.getZoom(), POINT_ZOOM) })
}

/** A map you click or drag a pin on. Typed coordinates move the pin; the pin writes them back. */
export function PickerMap({ point, focus, onPick }: PickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const initialPoint = useRef(point)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const wrapper = containerRef.current
    if (!wrapper || !token) return

    const start = initialPoint.current
    const { map, remove } = createProductMap(
      wrapper,
      token,
      start ? { center: [start.longitude, start.latitude], zoom: POINT_ZOOM } : UNSET_VIEW,
    )
    map.getCanvas().style.cursor = 'crosshair'
    map.on('click', (event) => {
      onPickRef.current({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    })
    // Created once and only added to the map while there's a point to show.
    const marker = new mapboxgl.Marker({ draggable: true, color: '#c2410c' })
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLngLat()
      onPickRef.current({ latitude: lat, longitude: lng })
    })
    mapRef.current = map
    markerRef.current = marker

    return () => {
      markerRef.current = null
      mapRef.current = null
      remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    if (!point) {
      marker.remove()
      return
    }
    const lngLat: [number, number] = [point.longitude, point.latitude]
    marker.setLngLat(lngLat).addTo(map)
    keepInView(map, lngLat)
  }, [point])

  useEffect(() => {
    if (!focus) return
    mapRef.current?.flyTo({ center: [focus.longitude, focus.latitude], zoom: POINT_ZOOM })
  }, [focus])

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return <p className="text-sm">The map needs NEXT_PUBLIC_MAPBOX_TOKEN.</p>
  }
  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-[var(--style-radius-s)] border border-[var(--theme-elevation-150)]"
    />
  )
}
