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

export const SingleEventBlock: Block = {
  slug: 'singleEvent',
  interfaceName: 'SingleEventBlock',
  imageURL: '/thumbnail/SingleEventThumbnail.jpg',
  fields: [...defaultFields],
}
