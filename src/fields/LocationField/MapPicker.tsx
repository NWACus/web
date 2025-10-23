'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Coordinates } from './types'

interface MapPickerProps {
  accessToken: string
  onLocationSelect: (data: {
    coordinates: Coordinates
    address?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    placeName?: string
    fullAddress?: string
  }) => void
  initialCoordinates?: Coordinates
  isOpen: boolean
  onClose: () => void
}

/**
 * MapPicker Component
 *
 * Interactive Mapbox GL map for picking a location by clicking on the map.
 * Performs reverse geocoding to get address information from coordinates.
 */
export const MapPicker: React.FC<MapPickerProps> = ({
  accessToken,
  onLocationSelect,
  initialCoordinates,
  isOpen,
  onClose,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(
    initialCoordinates || null,
  )

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapContainer.current || map.current) return

    mapboxgl.accessToken = accessToken

    // Create map instance
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: initialCoordinates || [-122.4194, 47.6062], // Default to Seattle
      zoom: initialCoordinates ? 12 : 9,
    })

    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add click handler
    mapInstance.on('click', async (e) => {
      const coords: Coordinates = [e.lngLat.lng, e.lngLat.lat]
      setSelectedCoords(coords)

      // Add or update marker
      if (marker.current) {
        marker.current.setLngLat(coords)
      } else {
        marker.current = new mapboxgl.Marker({ color: '#FF0000', draggable: false })
          .setLngLat(coords)
          .addTo(mapInstance)
      }

      // Reverse geocode
      await reverseGeocode(coords)
    })

    map.current = mapInstance

    // Add initial marker if coordinates exist
    if (initialCoordinates) {
      marker.current = new mapboxgl.Marker({ color: '#FF0000', draggable: false })
        .setLngLat(initialCoordinates)
        .addTo(mapInstance)
    }

    return () => {
      if (marker.current) {
        marker.current.remove()
        marker.current = null
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [isOpen, accessToken, initialCoordinates])

  /**
   * Reverse geocode coordinates to get address information
   */
  const reverseGeocode = useCallback(
    async (coords: Coordinates) => {
      setIsLoading(true)
      try {
        const [lng, lat] = coords
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&types=address,place,poi`,
        )

        if (!response.ok) {
          throw new Error('Geocoding failed')
        }

        const data = await response.json()
        const feature = data.features[0]

        if (feature) {
          // Extract address components from context
          let address = ''
          let city = ''
          let state = ''
          let postalCode = ''
          let country = 'US'

          // Get street address from the feature text or properties
          if (feature.place_type.includes('address')) {
            address = feature.text || ''
            if (feature.address) {
              address = `${feature.address} ${address}`
            }
          } else if (feature.properties?.address) {
            address = feature.properties.address
          }

          // Parse context for city, state, postal code
          if (feature.context) {
            feature.context.forEach((ctx: any) => {
              if (ctx.id.startsWith('place')) city = ctx.text
              if (ctx.id.startsWith('region'))
                state = ctx.short_code?.replace('US-', '') || ctx.text
              if (ctx.id.startsWith('postcode')) postalCode = ctx.text
              if (ctx.id.startsWith('country')) country = ctx.short_code || ctx.text
            })
          }

          onLocationSelect({
            coordinates: coords,
            address,
            city,
            state,
            postalCode,
            country,
            placeName: feature.text,
            fullAddress: feature.place_name,
          })
        } else {
          // No address found, just use coordinates
          onLocationSelect({
            coordinates: coords,
          })
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error)
        // Still save the coordinates even if geocoding fails
        onLocationSelect({
          coordinates: coords,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [accessToken, onLocationSelect],
  )

  /**
   * Handle confirm button
   */
  const handleConfirm = () => {
    if (selectedCoords) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="location-field__map-modal">
      <div className="location-field__map-modal-overlay" onClick={onClose} />
      <div className="location-field__map-modal-content">
        <div className="location-field__map-modal-header">
          <h3>Pick Location on Map</h3>
          <button
            type="button"
            className="location-field__map-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="location-field__map-modal-body">
          <div ref={mapContainer} className="location-field__map-container" />

          {isLoading && <div className="location-field__map-loading">Loading address...</div>}

          {selectedCoords && !isLoading && (
            <div className="location-field__map-info">
              <p>
                <strong>Selected:</strong> {selectedCoords[1].toFixed(6)},{' '}
                {selectedCoords[0].toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <div className="location-field__map-modal-footer">
          <button type="button" className="location-field__map-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="location-field__map-confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedCoords || isLoading}
          >
            {isLoading ? 'Loading...' : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  )
}
