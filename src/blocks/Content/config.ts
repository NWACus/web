import type { Block } from 'payload'

import colorPickerField from '@/fields/color'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { BlogListBlockLexical } from '../BlogList/config'
import { ButtonsBlock } from '../Buttons/config'

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  imageURL: '/thumbnail/ContentThumbnail.jpg',
  fields: [
    // Background color
    colorPickerField('Background color'),
    {
      name: 'columns',
      label: false,
      labels: {
        plural: 'Columns',
        singular: 'Column',
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
                BlocksFeature({
                  blocks: [ButtonsBlock, BlogListBlockLexical],
                }),
                HorizontalRuleFeature(),
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
