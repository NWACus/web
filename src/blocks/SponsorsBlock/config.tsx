import colorPickerField from '@/fields/color'
import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block, Field } from 'payload'

export const defaultFields: Field[] = [
  {
    name: 'title',
    type: 'text',
  },
  colorPickerField('Title background color'),
  {
    type: 'radio',
    name: 'sponsorsLayout',
    label: 'Choose a layout for the sponsors logos',
    defaultValue: 'dynamic',
    required: true,
    options: [
      {
        label: 'Static',
        value: 'static',
      },
      {
        label: 'Carousel (ideal for 6+ sponsors)',
        value: 'carousel',
      },
      {
        label: 'Single',
        value: 'single',
      },
    ],
  },
  {
    name: 'sponsorsSingle',
    type: 'relationship',
    relationTo: 'sponsors',
    label: 'Choose a sponsor',
    hasMany: false,
    required: true,
    admin: {
      condition: (_, siblingData) => siblingData?.sponsorsLayout === 'single',
    },
    filterOptions: getTenantFilter,
  },
  {
    name: 'sponsorsMulti',
    type: 'relationship',
    relationTo: 'sponsors',
    label: 'Choose sponsors',
    hasMany: true,
    required: true,
    admin: {
      condition: (_, siblingData) => siblingData?.sponsorsLayout !== 'single',
    },
    filterOptions: getTenantFilter,
  },
]

const sponsorsBlockWithFields = (fields?: Field[]): Block => ({
  slug: 'sponsorsBlock',
  interfaceName: 'SponsorsBlock',
  imageURL: '/thumbnail/SponsorsThumbnail.jpg',
  fields: [...defaultFields, ...(fields ?? [])],
})

export const SponsorsBlock = sponsorsBlockWithFields()

export const SponsorsBlockLexical = sponsorsBlockWithFields([
  {
    name: 'wrapInContainer',
    admin: {
      description:
        'Checking this will render the block with additional padding around it and using the background color you have selected.',
    },
    type: 'checkbox',
    defaultValue: false,
  },
])
