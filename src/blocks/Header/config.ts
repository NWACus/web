import type { Block } from 'payload'

import colorPickerField from '@/fields/color'
import {
  AlignFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Header: Block = {
  slug: 'header',
  interfaceName: 'HeaderBlock',
  imageURL: '/thumbnail/HeaderThumbnail.jpg',
  fields: [
    // Background color
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
      defaultValue: false,
    },
  ],
}
