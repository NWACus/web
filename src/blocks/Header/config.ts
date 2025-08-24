import type { Block } from 'payload'

import colorPickerField from '@/fields/color'
import {
  AlignFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const HeaderBlock: Block = {
  slug: 'headerBlock',
  interfaceName: 'HeaderBlock',
  imageURL: '/thumbnail/HeaderThumbnail.jpg',
  fields: [
    {
      name: 'richText',
      type: 'richText',
      required: true,
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
      label: false,
    },
    colorPickerField('Background color'),
    {
      name: 'wrapInContainer',
      admin: {
        description:
          'Checking this will render the block with additional padding around it and using the background color you have selected.',
      },
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
