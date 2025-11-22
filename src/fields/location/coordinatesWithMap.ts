import { FieldAdmin } from 'node_modules/payload/dist/fields/config/types'
import { Field } from 'payload'

export const coordinatesWithMap = (adminOptions: FieldAdmin): Field[] => [
  {
    name: 'coordinates',
    type: 'point',
    label: 'Coordinates',
    admin: adminOptions,
  },
  {
    type: 'ui',
    name: 'locationMap',
    admin: {
      ...adminOptions,
      components: {
        Field: {
          path: '@/fields/location/components/LocationMap#LocationMap',
        },
      },
    },
  },
]
