import { validateZipCode } from '@/utilities/validateZipCode'
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
        type: 'select',
        label: 'State',
        options: [
          { label: 'Alabama', value: 'AL' },
          { label: 'Alaska', value: 'AK' },
          { label: 'Arizona', value: 'AZ' },
          { label: 'Arkansas', value: 'AR' },
          { label: 'California', value: 'CA' },
          { label: 'Colorado', value: 'CO' },
          { label: 'Connecticut', value: 'CT' },
          { label: 'Delaware', value: 'DE' },
          { label: 'Florida', value: 'FL' },
          { label: 'Georgia', value: 'GA' },
          { label: 'Hawaii', value: 'HI' },
          { label: 'Idaho', value: 'ID' },
          { label: 'Illinois', value: 'IL' },
          { label: 'Indiana', value: 'IN' },
          { label: 'Iowa', value: 'IA' },
          { label: 'Kansas', value: 'KS' },
          { label: 'Kentucky', value: 'KY' },
          { label: 'Louisiana', value: 'LA' },
          { label: 'Maine', value: 'ME' },
          { label: 'Maryland', value: 'MD' },
          { label: 'Massachusetts', value: 'MA' },
          { label: 'Michigan', value: 'MI' },
          { label: 'Minnesota', value: 'MN' },
          { label: 'Mississippi', value: 'MS' },
          { label: 'Missouri', value: 'MO' },
          { label: 'Montana', value: 'MT' },
          { label: 'Nebraska', value: 'NE' },
          { label: 'Nevada', value: 'NV' },
          { label: 'New Hampshire', value: 'NH' },
          { label: 'New Jersey', value: 'NJ' },
          { label: 'New Mexico', value: 'NM' },
          { label: 'New York', value: 'NY' },
          { label: 'North Carolina', value: 'NC' },
          { label: 'North Dakota', value: 'ND' },
          { label: 'Ohio', value: 'OH' },
          { label: 'Oklahoma', value: 'OK' },
          { label: 'Oregon', value: 'OR' },
          { label: 'Pennsylvania', value: 'PA' },
          { label: 'Rhode Island', value: 'RI' },
          { label: 'South Carolina', value: 'SC' },
          { label: 'South Dakota', value: 'SD' },
          { label: 'Tennessee', value: 'TN' },
          { label: 'Texas', value: 'TX' },
          { label: 'Utah', value: 'UT' },
          { label: 'Vermont', value: 'VT' },
          { label: 'Virginia', value: 'VA' },
          { label: 'Washington', value: 'WA' },
          { label: 'West Virginia', value: 'WV' },
          { label: 'Wisconsin', value: 'WI' },
          { label: 'Wyoming', value: 'WY' },
          { label: 'District of Columbia', value: 'DC' },
        ],
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
  {
    name: 'coordinates',
    type: 'point',
    label: 'Coordinates',
    admin: {
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
