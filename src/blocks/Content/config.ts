import type { Block } from 'payload'

import colorPickerField from '@/fields/color'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { ButtonsBlock } from '../Buttons/config'
import { GenericEmbedLexical } from '../GenericEmbed/config'
import { MediaBlock } from '../MediaBlock/config'
import { SingleBlogPostBlockLexical } from '../SingleBlogPost/config'

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
                  blocks: [
                    ButtonsBlock,
                    MediaBlock,
                    GenericEmbedLexical,
                    SingleBlogPostBlockLexical,
                  ],
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
