/**
 * LocationField - Reusable location field for Payload CMS
 *
 * Provides both geocoded (via Mapbox) and manual entry modes for location data.
 * Stores coordinates, address components, and optional Mapbox metadata.
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

// Only export the config function, not the client component
// The component should be referenced by path string in the config
export { locationField } from './config'
export type {
  Coordinates,
  LocationData,
  LocationFieldComponentProps,
  LocationFieldConfig,
  LocationInputMode,
  MapboxFeature,
} from './types'
