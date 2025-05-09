import type { Block } from 'payload'

import colorPickerField from '@/fields/color'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  fields: [
    // Background color
    colorPickerField('Background color'),
    {
      name: 'columns',
      label: false,
      labels: {
        plural: 'Columns',
        singular: 'Columns',
      },
      type: 'array',
      admin: {
        initCollapsed: false,
      },
      defaultValue: [
        {
          columns: [],
        },
      ],
      maxRows: 4,
      fields: [
        {
          name: 'richText',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => {
              return [
                ...rootFeatures,
                HorizontalRuleFeature(),
                HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                FixedToolbarFeature(),
                InlineToolbarFeature(),
              ]
            },
          }),
          label: false,
        },
      ],
    },
  ],
}
