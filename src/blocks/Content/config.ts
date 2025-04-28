import type { Block, Field } from 'payload'

import colorPickerField from '@/fields/color'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

const columnFields: Field[] = [
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
    required: true,
  },
]

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  fields: [
    // Background color
    colorPickerField,
    {
      name: 'enableColumns',
      label: 'Use columns',
      type: 'checkbox',
    },
    // Show ability to add columns if checkbox is enabled
    {
      name: 'columns',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData.enableColumns,
      },
      fields: columnFields,
    },
    // Render content as single field
    {
      name: 'content',
      type: 'group',
      admin: {
        condition: (_, siblingData) => !siblingData.enableColumns,
        hideGutter: true,
      },
      fields: columnFields,
    },
  ],
}
