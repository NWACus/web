import type { Field } from 'payload'

/**
 * GeoJSON Point coordinates [longitude, latitude]
 */
export type Coordinates = [number, number]

/**
 * Complete location data structure
 */
export interface LocationData {
  // Core location data
  coordinates?: {
    type: 'Point'
    coordinates: Coordinates
  }
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string

  // Mapbox-specific fields (populated via reverse geocoding)
  placeName?: string
  fullAddress?: string

  // Virtual event support
  isVirtual?: boolean
  virtualUrl?: string

  // Additional information
  extraInfo?: string
}

/**
 * Configuration options for the location field
 */
export interface LocationFieldConfig {
  /** Field name in the collection */
  name?: string
  /** Field label in admin panel */
  label?: string
  /** Whether the field is required */
  required?: boolean
  /** Admin configuration */
  admin?: {
    description?: string
    condition?: (data: any, siblingData: any) => boolean
    [key: string]: any
  }
}

/**
 * Props for the LocationField component
 */
export interface LocationFieldComponentProps {
  path: string
  field?: Field
  readOnly?: boolean
  [key: string]: any
}
