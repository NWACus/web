'use client'

import { disableRotation, MAP_STYLE } from '@/components/map/mapbox'
import { MapMarker } from '@/components/stationMap/MapMarker'
import { useMapBackgroundClick } from '@/components/stationMap/useStationMap'
import { formatDateTime } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'
import { MapPin } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { EventPlace } from './eventPlaces'

export type FocusRequest = { key: string; requestedAt: number }

interface EventsMapProps {
  places: EventPlace[]
  selectedKey: string | null
  hoveredKey: string | null
  focus: FocusRequest | null
  onSelect: (key: string) => void
  onClear: () => void
}

const FIT_PADDING = 48
const FOCUS_ZOOM = 11

function useEventsMapInstance(containerRef: RefObject<HTMLDivElement | null>) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const wrapper = containerRef.current
    if (!wrapper || !token) return
    mapboxgl.accessToken = token
    // A fresh element per map: dev's double-mounted effect would otherwise hand Mapbox a used one.
    const container = wrapper.appendChild(document.createElement('div'))
    container.className = 'h-full w-full'
    const instance = new mapboxgl.Map({
      container,
      style: MAP_STYLE,
      center: [-114, 44],
      zoom: 3.5,
      cooperativeGestures: true,
    })
    disableRotation(instance)
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    setMap(instance)
    return () => {
      setMap(null)
      instance.remove()
      container.remove()
    }
  }, [containerRef])

  return map
}

/** Frames every pin whenever the set of pins changes, i.e. when the filters change. */
function useFitToPlaces(map: mapboxgl.Map | null, places: EventPlace[]) {
  const placesKey = places.map((place) => place.key).join('|')
  const placesRef = useRef(places)
  placesRef.current = places

  useEffect(() => {
    const current = placesRef.current
    if (!map || current.length === 0) return
    const bounds = new mapboxgl.LngLatBounds()
    for (const place of current) bounds.extend([place.longitude, place.latitude])
    map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FOCUS_ZOOM, duration: 0 })
  }, [map, placesKey])
}

function PlacePopup({ place }: { place: EventPlace }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 rounded-md border bg-card text-card-foreground p-3 shadow-lg text-left">
      <ul className="flex flex-col gap-2">
        {place.events.map((event) => (
          <li key={event.id}>
            <Link href={`/events/${event.slug}`} className="font-semibold text-sm hover:underline">
              {event.title}
            </Link>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(event.startDate, event.startDate_tz, 'EEE, MMM d')}
              {event.location?.placeName && ` · ${event.location.placeName}`}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Flies to a pin when the list asks to show an event on the map. */
function useFlyToFocus(map: mapboxgl.Map | null, places: EventPlace[], focus: FocusRequest | null) {
  const placesRef = useRef(places)
  placesRef.current = places
  useEffect(() => {
    const place = focus && placesRef.current.find((candidate) => candidate.key === focus.key)
    if (!map || !place) return
    map.flyTo({
      center: [place.longitude, place.latitude],
      zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
    })
  }, [map, focus])
}

interface EventPinProps {
  map: mapboxgl.Map
  place: EventPlace
  selected: boolean
  active: boolean
  onSelect: (key: string) => void
}

function EventPin({ map, place, selected, active, onSelect }: EventPinProps) {
  // Stable so the marker isn't torn down and re-added on every render.
  const lngLat = useMemo<[number, number]>(
    () => [place.longitude, place.latitude],
    [place.longitude, place.latitude],
  )
  return (
    <MapMarker map={map} lngLat={lngLat} raised={active}>
      <div className="relative">
        <div
          onClick={() => onSelect(place.key)}
          className={cn(
            'flex h-8 min-w-8 px-1 items-center justify-center rounded-full border-2 border-white shadow-md text-xs font-semibold cursor-pointer transition-transform',
            active
              ? 'bg-foreground text-background scale-125'
              : 'bg-primary text-primary-foreground',
          )}
        >
          {place.events.length > 1 ? place.events.length : <MapPin className="h-4 w-4" />}
        </div>
        {selected && <PlacePopup place={place} />}
      </div>
    </MapMarker>
  )
}

export function EventsMap({
  places,
  selectedKey,
  hoveredKey,
  focus,
  onSelect,
  onClear,
}: EventsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const map = useEventsMapInstance(containerRef)
  useFitToPlaces(map, places)
  useMapBackgroundClick(map, onClear)
  useFlyToFocus(map, places, focus)

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
        The map isn’t configured.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      {map &&
        places.map((place) => (
          <EventPin
            key={place.key}
            map={map}
            place={place}
            selected={place.key === selectedKey}
            active={place.key === selectedKey || place.key === hoveredKey}
            onSelect={onSelect}
          />
        ))}
    </div>
  )
}
