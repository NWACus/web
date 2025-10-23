'use client'

import { SearchBox } from '@mapbox/search-js-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState } from 'react'

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export function LocationPicker() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const [, setMapLoaded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  useEffect(() => {
    mapboxgl.accessToken = accessToken

    mapInstanceRef.current = new mapboxgl.Map({
      container: mapContainerRef.current, // container ID
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 9, // starting zoom
    })

    mapInstanceRef.current.on('load', () => {
      setMapLoaded(true)
    })
  }, [])

  return (
    <>
      <SearchBox
        accessToken={accessToken}
        map={mapInstanceRef.current}
        mapboxgl={mapboxgl}
        value={inputValue}
        onChange={(d) => {
          setInputValue(d)
        }}
        options={{
          types: 'address,poi,place',
        }}
        marker
      />
      <div id="map-container" ref={mapContainerRef} style={{ height: 300 }} />
    </>
  )
}
