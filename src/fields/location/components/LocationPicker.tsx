'use client'

import { SearchBox } from '@mapbox/search-js-react'
import { SearchBoxProps } from '@mapbox/search-js-react/dist/components/SearchBox'
import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui'
import mapboxgl, { LngLatLike, Marker as MarkerType } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Marker from './Marker'

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

const path = 'location'

export function LocationPicker() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<MarkerType>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const placeNameField = useField<string>({ path: `${path}.placeName` })
  const addressField = useField<string>({ path: `${path}.address` })
  const cityField = useField<string>({ path: `${path}.city` })
  const stateField = useField<string>({ path: `${path}.state` })
  const zipField = useField<string>({ path: `${path}.zip` })
  const countryField = useField<string>({ path: `${path}.country` })

  const coordinatesField = useField<[number, number]>({
    path: `${path}.coordinates`,
  })
  const coordinates = useMemo<LngLatLike | undefined>(
    () =>
      coordinatesField.value ? [coordinatesField.value[0], coordinatesField.value[1]] : undefined,
    [coordinatesField.value],
  )

  const mapboxIdField = useField<string>({ path: `${path}.mapboxId` })
  const placeTypeField = useField<string>({ path: `${path}.placeType` })

  const handleLocationSelect = useCallback(
    (data: {
      placeName?: string
      address?: string
      city?: string
      state?: string
      zip?: string
      country?: string
      coordinates: [number, number]
      mapboxId?: string
      placeType?: string
    }) => {
      placeNameField.setValue(data.placeName || '')
      addressField.setValue(data.address || '')
      cityField.setValue(data.city || '')
      stateField.setValue(data.state || '')
      zipField.setValue(data.zip || '')
      countryField.setValue(data.country || 'US')
      coordinatesField.setValue(data.coordinates)
      mapboxIdField.setValue(data.mapboxId || '')
      placeTypeField.setValue(data.placeType || '')
    },
    [
      placeNameField,
      addressField,
      cityField,
      stateField,
      zipField,
      countryField,
      coordinatesField,
      mapboxIdField,
      placeTypeField,
    ],
  )

  function handleRetrieve(res: Parameters<NonNullable<SearchBoxProps['onRetrieve']>>[number]) {
    const feature = res.features[0]

    if (!feature) {
      throw new Error('Invalid response from Mapbox')
    }

    const properties = feature.properties

    handleLocationSelect({
      placeName: properties.name,
      address: properties.address,
      city: properties.context.place?.name,
      state: properties.context.region?.region_code,
      zip: properties.context.postcode?.name,
      country: properties.context.country?.country_code,
      coordinates: [properties.coordinates.longitude, properties.coordinates.latitude],
      mapboxId: properties.mapbox_id,
      placeType: properties.feature_type,
    })
    setInputValue('')
  }

  useEffect(() => {
    mapboxgl.accessToken = accessToken

    if (mapContainerRef.current && !mapLoaded) {
      mapInstanceRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: coordinates ? coordinates : [-113, 42.4],
        zoom: 14,
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
        if (!markerRef.current || markerRef.current.getLngLat() !== coordinates) {
          if (markerRef.current && markerRef.current.getLngLat() !== coordinates) {
            markerRef.current.remove()
          }

          // TODO remove marker if coordinates become invalid
        }
      }
    },
    [coordinates, mapLoaded, placeNameField.value],
  )

  return (
    <div className="field-type">
      <FieldLabel htmlFor={path} label="Search for a location" />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          {mapInstanceRef.current && (
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
                country: 'US',
              }}
              onRetrieve={handleRetrieve}
              theme={{
                variables: {
                  unit: '13px',
                },
              }}
            />
          )}
          <FieldDescription
            description="Selecting a location in the search results will populate all of the associated fields below. Be careful, this will override any existing values."
            path={path}
          />
        </div>
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
    </div>
  )
}
