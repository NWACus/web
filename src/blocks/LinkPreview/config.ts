import type { Block, Field } from 'payload'

import { button } from '@/fields/button'
import colorPickerField from '@/fields/color'
import { getImageTypeFilter } from '@/utilities/collectionFilters'

const cardFields: Field[] = [
  {
    name: 'image',
    type: 'upload',
    relationTo: 'media',
    required: true,
    filterOptions: getImageTypeFilter,
  },
  {
    name: 'title',
    type: 'text',
    required: true,
  },

  {
    name: 'text',
    type: 'textarea',
    required: true,
  },
  button(['default', 'secondary', 'outline']),
]

export const LinkPreviewBlock: Block = {
  slug: 'linkPreview',
  interfaceName: 'LinkPreviewBlock',
  imageURL: '/thumbnail/LinkPreviewThumbnail.jpg',
  fields: [
    colorPickerField('Background color'),
    {
      name: 'cards',
      label: '',
      labels: {
        plural: 'Link preview cards',
        singular: 'Link preview card',
      },
      type: 'array',
      fields: cardFields,
      minRows: 2,
      maxRows: 3,
    },
  ],
}
