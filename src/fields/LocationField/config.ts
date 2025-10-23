import type { Field, GroupField } from 'payload'
import type { LocationFieldConfig } from './types'

/**
 * Creates a reusable location field configuration for Payload CMS
 *
 * This field supports both geocoded locations (via Mapbox) and manual entry.
 * It stores coordinates, address components, and optional Mapbox-specific metadata.
 *
 * @param config - Configuration options for the location field
 * @returns A Payload GroupField configuration
 *
 * @example
 * ```typescript
 * import { locationField } from '@/fields/LocationField'
 *
 * export const Events: CollectionConfig = {
 *   fields: [
 *     locationField({
 *       name: 'location',
 *       label: 'Event Location',
 *       required: true,
 *     }),
 *   ]
 * }
 * ```
 */
export const locationField = (config: LocationFieldConfig = {}): GroupField => {
  const { name = 'location', label = 'Location', required = false, admin = {} } = config

  return {
    name,
    type: 'group',
    label,
    admin: {
      ...admin,
    },
    fields: [
      // UI Component for geocoding/manual entry
      {
        type: 'ui',
        name: 'locationUI',
        admin: {
          components: {
            Field: {
              path: '@/fields/LocationField/LocationPicker#LocationPicker',
            },
          },
        },
      },

      // Input mode tracking (hidden from UI)
      {
        name: 'inputMode',
        type: 'select',
        defaultValue: 'geocoded',
        options: [
          { label: 'Geocoded', value: 'geocoded' },
          { label: 'Manual', value: 'manual' },
        ],
        admin: {
          hidden: true,
        },
      },

      // REQUIRED: Core location data (works with both modes)
      {
        name: 'coordinates',
        type: 'point',
        label: 'Coordinates',
        required,
        admin: {
          description: 'Geographic coordinates (longitude, latitude)',
          readOnly: true,
        },
      },
      {
        name: 'address',
        type: 'text',
        label: 'Street Address',
        admin: {
          description: 'Street address',
          readOnly: true,
        },
      },
      {
        name: 'city',
        type: 'text',
        label: 'City',
        admin: {
          description: 'City name',
          readOnly: true,
        },
      },
      {
        name: 'state',
        type: 'text',
        label: 'State',
        admin: {
          description: 'State or province code (e.g., WA, OR)',
          readOnly: true,
        },
      },
      {
        name: 'postalCode',
        type: 'text',
        label: 'Postal Code',
        admin: {
          description: 'ZIP or postal code',
          readOnly: true,
        },
      },
      {
        name: 'country',
        type: 'text',
        label: 'Country',
        defaultValue: 'US',
        admin: {
          description: 'Country code',
          readOnly: true,
        },
      },

      // OPTIONAL: Mapbox-specific fields (only from geocoder)
      {
        name: 'mapboxId',
        type: 'text',
        label: 'Mapbox Place ID',
        admin: {
          description: 'Permanent Mapbox place identifier',
          hidden: true,
        },
      },
      {
        name: 'placeName',
        type: 'text',
        label: 'Place Name',
        admin: {
          description: 'Name of the venue or place',
          hidden: true,
        },
      },
      {
        name: 'placeType',
        type: 'text',
        label: 'Place Type',
        admin: {
          description: 'Mapbox place type (e.g., poi, address)',
          hidden: true,
        },
      },
      {
        name: 'fullAddress',
        type: 'text',
        label: 'Full Formatted Address',
        admin: {
          description: 'Complete formatted address from Mapbox',
          hidden: true,
        },
      },

      // Virtual event support
      {
        name: 'isVirtual',
        type: 'checkbox',
        label: 'Virtual Event',
        defaultValue: false,
        admin: {
          description: 'Check if this is a virtual event',
        },
      },
      {
        name: 'virtualUrl',
        type: 'text',
        label: 'Virtual Event URL',
        admin: {
          description: 'URL for virtual event (Zoom, Teams, etc.)',
          condition: (_data, siblingData) => {
            // Show this field when isVirtual is checked
            if (siblingData?.isVirtual) return true
            return false
          },
        },
      },

      // Extra information
      {
        name: 'extraInfo',
        type: 'text',
        label: 'Additional Information',
        admin: {
          description: 'Extra details (e.g., "Meet in parking lot 4", "Look for the blue tent")',
        },
      },
    ] as Field[],
  }
}
