import { isRecord } from '@/utilities/isRecord'
import type { GroupField, NumberField, SelectField } from 'payload'

const BOTH_OR_NEITHER = 'Enter both latitude and longitude, or leave both blank.'

const coordinate = (
  name: 'latitude' | 'longitude',
  limit: number,
  placeholder: string,
): NumberField => {
  const other = name === 'latitude' ? 'longitude' : 'latitude'
  return {
    name,
    type: 'number',
    min: -limit,
    max: limit,
    index: true,
    admin: { step: 0.000001, placeholder },
    validate: (value, { siblingData }) => {
      const otherValue = isRecord(siblingData) ? siblingData[other] : null
      const hasValue = typeof value === 'number'
      const hasOther = typeof otherValue === 'number'
      if (hasValue !== hasOther) return BOTH_OR_NEITHER
      if (hasValue && Math.abs(value) > limit) return `Must be between -${limit} and ${limit}.`
      return true
    },
  }
}

export type GeocodeStatus = 'geocoded' | 'approximate' | 'manual' | 'failed'

/** Where the point came from. `manual` points are never overwritten by the geocoder. */
const geocodeStatusField: SelectField = {
  name: 'geocodeStatus',
  type: 'select',
  options: [
    { label: 'Matched to the address', value: 'geocoded' },
    { label: 'Approximate (street, city or ZIP center)', value: 'approximate' },
    { label: 'Placed by hand', value: 'manual' },
    { label: 'No match for the address', value: 'failed' },
  ],
  admin: { hidden: true },
}

/**
 * Latitude/longitude as two indexed number columns rather than Payload's `point` field, so the
 * SQLite adapter can range-query them. See `src/utilities/geo/findNear.ts`.
 */
export const coordinatesField = ({
  condition,
}: { condition?: NonNullable<GroupField['admin']>['condition'] } = {}): GroupField => ({
  name: 'coordinates',
  type: 'group',
  // No heading (the map picker labels this block); the gutter groups the map with its numbers.
  label: false,
  admin: { condition },
  fields: [
    {
      name: 'picker',
      type: 'ui',
      admin: {
        components: {
          Field: '@/fields/location/components/CoordinatesPicker#CoordinatesPicker',
        },
      },
    },
    {
      type: 'row',
      fields: [
        coordinate('latitude', 90, 'e.g. 47.6062'),
        coordinate('longitude', 180, 'e.g. -122.3321'),
      ],
    },
    geocodeStatusField,
  ],
})
