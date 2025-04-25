import type { Block, Field } from 'payload'
import thumbnail from './LinkPreviewThumbnail.jpg'

import { button } from '@/fields/button'

const cardFields: Field[] = [
  {
    name: 'image',
    type: 'upload',
    relationTo: 'media',
    required: true,
    filterOptions: {
      mimeType: { contains: 'image' },
    },
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
  imageURL: `${thumbnail.src}`,
  fields: [
    {
      name: 'cards',
      label: 'Link preview',
      labels: {
        plural: 'Link previews',
        singular: 'Link preview',
      },
      type: 'array',
      fields: cardFields,
      minRows: 2,
      maxRows: 3,
    },
  ],
}
