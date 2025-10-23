'use client'

import { useField } from '@payloadcms/ui'
import React from 'react'
import { MapPicker } from './MapPicker'
import type { Coordinates, LocationFieldComponentProps } from './types'

const baseClass = 'location-field'

/**
 * LocationField Component
 *
 * A custom Payload field that uses an interactive Mapbox map for location selection.
 * Users can click on the map to select a location, and the address is automatically
 * populated via reverse geocoding.
 */
export const LocationFieldComponent: React.FC<LocationFieldComponentProps> = (props) => {
  const { path, readOnly } = props

  // Get field values using Payload's useField hook
  const coordinates = useField<{ type: 'Point'; coordinates: [number, number] }>({
    path: `${path}.coordinates`,
  })
  const address = useField<string>({ path: `${path}.address` })
  const city = useField<string>({ path: `${path}.city` })
  const state = useField<string>({ path: `${path}.state` })
  const postalCode = useField<string>({ path: `${path}.postalCode` })
  const country = useField<string>({ path: `${path}.country` })
  const placeName = useField<string>({ path: `${path}.placeName` })
  const fullAddress = useField<string>({ path: `${path}.fullAddress` })

  // Local state
  const [isMapOpen, setIsMapOpen] = React.useState(false)

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

  /**
   * Handle location selection from map picker
   */
  const handleLocationSelect = React.useCallback(
    (data: {
      coordinates: Coordinates
      address?: string
      city?: string
      state?: string
      postalCode?: string
      country?: string
      placeName?: string
      fullAddress?: string
    }) => {
      // Update all fields
      coordinates.setValue({
        type: 'Point',
        coordinates: data.coordinates,
      })
      address.setValue(data.address || '')
      city.setValue(data.city || '')
      state.setValue(data.state || '')
      postalCode.setValue(data.postalCode || '')
      country.setValue(data.country || 'US')
      placeName.setValue(data.placeName || '')
      fullAddress.setValue(data.fullAddress || '')
    },
    [coordinates, address, city, state, postalCode, country, placeName, fullAddress],
  )

  /**
   * Handle opening the map picker
   */
  const handleOpenMap = () => {
    if (!accessToken) {
      alert('Mapbox token is not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to .env')
      return
    }
    setIsMapOpen(true)
  }

  /**
   * Handle closing the map picker
   */
  const handleCloseMap = () => {
    setIsMapOpen(false)
  }

  if (readOnly) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__readonly`}>
          <p>
            <strong>Location:</strong> {fullAddress.value || 'Not set'}
          </p>
          {coordinates.value && (
            <p>
              <strong>Coordinates:</strong> {coordinates.value.coordinates[1]},{' '}
              {coordinates.value.coordinates[0]}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h3>Location</h3>
      </div>

      {coordinates.value ? (
        // Display mode - show selected location
        <div className={`${baseClass}__display`}>
          <div className={`${baseClass}__summary`}>
            <p>
              <strong>Address:</strong> {fullAddress.value || address.value || 'Not set'}
            </p>
            <p>
              <strong>Coordinates:</strong> {coordinates.value.coordinates[1].toFixed(6)},{' '}
              {coordinates.value.coordinates[0].toFixed(6)}
            </p>
          </div>
          <button type="button" className={`${baseClass}__change-btn`} onClick={handleOpenMap}>
            Change Location
          </button>
        </div>
      ) : (
        // No location selected yet
        <div className={`${baseClass}__empty`}>
          <p>No location selected</p>
          <button type="button" className={`${baseClass}__pick-btn`} onClick={handleOpenMap}>
            Pick on Map
          </button>
        </div>
      )}

      {/* Map Picker Modal */}
      <MapPicker
        accessToken={accessToken}
        onLocationSelect={handleLocationSelect}
        initialCoordinates={coordinates.value?.coordinates}
        isOpen={isMapOpen}
        onClose={handleCloseMap}
      />
    </div>
  )
}
