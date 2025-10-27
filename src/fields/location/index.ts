import { Field, GroupField } from 'payload'

const coreLocationFields: Field[] = [
  {
    name: 'placeName',
    type: 'text',
    label: 'Place Name',
    admin: {
      description: 'Name of the venue or place',
      condition: (_data, siblingData) => !siblingData?.isVirtual,
    },
  },
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
        type: 'text',
        label: 'State',
        admin: {
          condition: (_data, siblingData) => !siblingData?.isVirtual,
        },
      },
      {
        name: 'zip',
        type: 'text',
        label: 'ZIP Code',
        admin: {
          condition: (_data, siblingData) => !siblingData?.isVirtual,
        },
      },
    ],
  },
  {
    name: 'country',
    type: 'text',
    label: 'Country',
    defaultValue: 'US',
    admin: {
      description: 'Country code',
      condition: (_data, siblingData) => !siblingData?.isVirtual,
    },
  },
  {
    name: 'coordinates',
    type: 'point',
    label: 'Coordinates',
    admin: {
      condition: (_data, siblingData) => !siblingData?.isVirtual,
    },
  },
  {
    name: 'fullAddress',
    type: 'text',
    admin: {
      description: 'Full, formatted address',
      condition: (_data, siblingData) => !siblingData?.isVirtual,
    },
  },
]

const mapboxFields: Field[] = [
  {
    name: 'mapboxId',
    type: 'text',
    admin: {
      description: 'Permanent Mapbox place identifier',
      hidden: true,
    },
  },
  {
    name: 'placeType',
    type: 'text',
    admin: {
      description: 'Mapbox place type (e.g., poi, address)',
      hidden: true,
    },
  },
]

export const locationField = (): GroupField => ({
  name: 'location',
  type: 'group',
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
      type: 'ui',
      name: 'locationPicker',
      admin: {
        components: {
          Field: {
            path: '@/fields/location/components/LocationPicker#LocationPicker',
          },
        },
        condition: (_data, siblingData) => !siblingData?.isVirtual,
      },
    },
    ...coreLocationFields,
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
    ...mapboxFields,
  ],
})
