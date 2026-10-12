import { validateZipCode } from '@/utilities/validateZipCode'
import { Field, GroupField } from 'payload'
import { coordinatesField } from './coordinatesField'
import { geocodeLocation } from './hooks/geocodeLocation'
import { stateOptions } from './states'

export const coreLocationFields: Field[] = [
  {
    name: 'address',
    type: 'text',
    label: 'Street Address',
    admin: {
      condition: (_data, siblingData) => !siblingData?.isVirtual,
    },
  },
  {
    type: 'row',
    fields: [
      {
        name: 'city',
        type: 'text',
        label: 'City',
        admin: {
          condition: (_data, siblingData) => !siblingData?.isVirtual,
        },
      },
      {
        name: 'state',
        type: 'select',
        label: 'State',
        options: stateOptions,
        admin: {
          condition: (_data, siblingData) => !siblingData?.isVirtual,
        },
      },
      {
        name: 'zip',
        type: 'text',
        label: 'ZIP Code',
        validate: validateZipCode,
        admin: {
          condition: (_data, siblingData) => !siblingData?.isVirtual,
        },
      },
    ],
  },
  {
    name: 'country',
    type: 'select',
    options: [{ label: 'United States - US', value: 'US' }],
    label: 'Country',
    defaultValue: 'US',
    admin: {
      condition: (_data, siblingData) => !siblingData?.isVirtual,
      readOnly: true,
    },
  },
]

export const locationField = (): GroupField => ({
  name: 'location',
  type: 'group',
  hooks: { beforeChange: [geocodeLocation] },
  fields: [
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
      name: 'placeName',
      type: 'text',
      label: 'Place Name',
      admin: {
        description: 'Name of the place or venue',
        condition: (_data, siblingData) => !siblingData?.isVirtual,
      },
      required: true,
    },
    ...coreLocationFields,
    coordinatesField({ condition: (_data, siblingData) => !siblingData?.isVirtual }),
    {
      name: 'coordinatesPicker',
      type: 'ui',
      admin: {
        condition: (_data, siblingData) => !siblingData?.isVirtual,
        components: {
          Field: '@/fields/location/components/CoordinatesPicker#CoordinatesPicker',
        },
      },
    },
    {
      name: 'virtualUrl',
      type: 'text',
      label: 'Virtual Event URL',
      admin: {
        description: 'URL for virtual event (Zoom, Teams, etc.)',
        condition: (_data, siblingData) => siblingData?.isVirtual,
      },
    },
    {
      name: 'extraInfo',
      type: 'text',
      label: 'Additional Information',
      admin: {
        description: 'Extra details (e.g., "Meet in parking lot 4", "Look for the blue tent")',
      },
    },
  ],
})
