import { isRecord } from '@/utilities/isRecord'
import type { GroupField, NumberField } from 'payload'

const BOTH_OR_NEITHER = 'Enter both latitude and longitude, or leave both blank.'

const coordinate = (name: 'latitude' | 'longitude', limit: number): NumberField => {
  const other = name === 'latitude' ? 'longitude' : 'latitude'
  return {
    name,
    type: 'number',
    min: -limit,
    max: limit,
    index: true,
    admin: { step: 0.000001 },
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

/**
 * Latitude/longitude as two indexed number columns rather than Payload's `point` field, so the
 * SQLite adapter can range-query them. See `src/utilities/geo/findNear.ts`.
 */
export const coordinatesField = ({
  condition,
}: { condition?: NonNullable<GroupField['admin']>['condition'] } = {}): GroupField => ({
  name: 'coordinates',
  type: 'group',
  admin: {
    description: 'Decimal degrees (e.g. 47.6062, -122.3321). Used for distance search.',
    condition,
  },
  fields: [
    {
      type: 'row',
      fields: [coordinate('latitude', 90), coordinate('longitude', 180)],
    },
  ],
})
