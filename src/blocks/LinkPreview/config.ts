import type { Block, Field } from 'payload'
import thumbnail from './LinkPreviewThumbnail.jpg'

import { link } from '@/fields/link'

const cardFields: Field[] = [
  {
    name: 'image',
    type: 'upload',
    relationTo: 'media',
    required: true,
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
  link({
    overrides: {
      label: 'Button',
    },
  }),
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
