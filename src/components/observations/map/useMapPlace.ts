'use client'

/**
 * The two ways the map moves on a reader's behalf: framing the zones they choose, and going to the
 * place they search for (zoom 12, marked with a red pin, as the widget does). The search lasts
 * until the reader drags the map or zooms back out past 10; then the count line stops saying
 * "near" it.
 */
import type { Map as MapboxMap } from 'mapbox-gl'
import mapboxgl from 'mapbox-gl'
import { useEffect, useRef } from 'react'

import type { ObservationZoneOption } from '@/services/nac/model/observation'

import type { ChosenPlace } from './placeSearch'
import { fitZones } from './useObservationMap'

const PLACE_ZOOM = 12
const PLACE_CLEARED_BELOW_ZOOM = 10
const PLACE_PIN_COLOR = '#d9534f'

/**
 * Frame the chosen zones whenever the choice changes to a non-empty one (a `?zone=` link too),
 * announcing the move first so the list waits for where the map lands.
 */
export function useZoneFraming(
  map: MapboxMap | null,
  chosen: ObservationZoneOption[],
  expectMove: () => void,
) {
  const key = chosen.map((zone) => zone.id).join(',')
  const chosenRef = useRef(chosen)
  chosenRef.current = chosen
  useEffect(() => {
    if (!map || chosenRef.current.length === 0) return
    expectMove()
    fitZones(map, chosenRef.current)
  }, [map, key, expectMove])
}

export function usePlaceMarker(
  map: MapboxMap | null,
  place: ChosenPlace | null,
  onCleared: () => void,
  expectMove: () => void,
) {
  const clearedRef = useRef(onCleared)
  clearedRef.current = onCleared

  useEffect(() => {
    if (!map || !place) return
    expectMove()
    map.jumpTo({ center: place.center, zoom: PLACE_ZOOM })
    const marker = new mapboxgl.Marker({ color: PLACE_PIN_COLOR })
      .setLngLat(place.center)
      .addTo(map)
    const clear = () => clearedRef.current()
    const clearWhenZoomedOut = () => {
      if (map.getZoom() < PLACE_CLEARED_BELOW_ZOOM) clear()
    }
    map.on('dragend', clear)
    map.on('zoomend', clearWhenZoomedOut)
    return () => {
      marker.remove()
      map.off('dragend', clear)
      map.off('zoomend', clearWhenZoomedOut)
    }
  }, [map, place, expectMove])
}
