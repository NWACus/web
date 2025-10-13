import type { Block, Field } from 'payload'

import { button } from '@/fields/button'
import colorPickerField from '@/fields/color'
import { getImageTypeFilter } from '@/utilities/collectionFilters'
import {
  AlignFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

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
    {
      name: 'header',
      type: 'richText',
      admin: {
        description: 'Leave blank if you do not want a title',
      },
      editor: lexicalEditor({
        features: () => {
          return [
            FixedToolbarFeature(),
            HeadingFeature({
              enabledHeadingSizes: ['h2', 'h3', 'h4'],
            }),
            AlignFeature(),
          ]
        },
      }),
    },
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
