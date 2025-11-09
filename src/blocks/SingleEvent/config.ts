import colorPickerField from '@/fields/color'
import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block, Field } from 'payload'

const defaultFields: Field[] = [
  colorPickerField('Background color'),
  {
    name: 'event',
    type: 'relationship',
    relationTo: 'events',
    required: true,
    admin: {
      description: 'Select an event to display',
    },
    filterOptions: getTenantFilter,
  },
]

const singleEventWithFields = (fields?: Field[]): Block => ({
  slug: 'singleEvent',
  interfaceName: 'SingleEventBlock',
  imageURL: '/thumbnail/SingleEventThumbnail.jpg',
  fields: [...defaultFields, ...(fields ?? [])],
})

export const SingleEventBlock = singleEventWithFields()

export const SingleEventBlockLexical = singleEventWithFields([
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
