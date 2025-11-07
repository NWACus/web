'use client'

import { useField } from '@payloadcms/ui'
import mapboxgl, { LngLatLike } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import Marker from './Marker'

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

const path = 'location'

export function LocationMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const placeNameField = useField<string>({ path: `${path}.placeName` })
  const coordinatesField = useField<[number, number]>({
    path: `${path}.coordinates`,
  })
  const coordinates = useMemo<LngLatLike | undefined>(() => {
    if (
      coordinatesField.value &&
      typeof coordinatesField.value[0] === 'number' &&
      typeof coordinatesField.value[1] === 'number'
    ) {
      return [coordinatesField.value[0], coordinatesField.value[1]]
    }
    return undefined
  }, [coordinatesField.value])

  useEffect(() => {
    mapboxgl.accessToken = accessToken

    if (mapContainerRef.current && !mapLoaded) {
      mapInstanceRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: coordinates ? coordinates : [-113, 42.4],
        zoom: 13,
        interactive: false,
      })

      mapInstanceRef.current.on('load', () => {
        setMapLoaded(true)
      })
    }
  }, [coordinates, mapLoaded])

  useEffect(
    function setCurrentCoordinatesAsMarker() {
      if (mapLoaded && mapInstanceRef.current && coordinates) {
        mapInstanceRef.current.setCenter(coordinates)
      }
    },
    [coordinates, mapLoaded],
  )

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="rounded overflow-hidden">
        <div
          id="map-container"
          ref={mapContainerRef}
          style={{ height: coordinates && coordinatesField.valid ? 300 : 0 }}
        />
      </div>
      {coordinates && coordinatesField.valid && mapInstanceRef.current && (
        <Marker
          map={mapInstanceRef.current}
          coordinates={coordinates}
          label={placeNameField.value}
        />
      )}
    </div>
  )
}
