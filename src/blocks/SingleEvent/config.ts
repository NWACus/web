import colorPickerField from '@/fields/color'
import { layoutField } from '@/fields/layout'
import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block, Field } from 'payload'

const defaultFields: Field[] = [
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
  fields: [...defaultFields, layoutField([colorPickerField('Background color')])],
}
