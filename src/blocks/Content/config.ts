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
import { DocumentBlock } from '../DocumentBlock/config'
import { GenericEmbedLexical } from '../GenericEmbed/config'
import { MediaBlock } from '../MediaBlock/config'
import { SingleBlogPostBlockLexical } from '../SingleBlogPost/config'
import { SponsorsBlockLexical } from '../SponsorsBlock/config'

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  imageURL: '/thumbnail/ContentThumbnail.jpg',
  fields: [
    // Background color
    colorPickerField('Background color'),
    {
      name: 'layout',
      type: 'select',
      required: true,
      options: [
        { label: 'full', value: '1_1' },
        { label: '1:1', value: '2_11' },
        { label: '1:1:1', value: '3_111' },
        { label: '1:2', value: '2_12' },
        { label: '2:1', value: '2_21' },
        { label: '1:1:1:1', value: '4_1111' },
        { label: '1:1:2', value: '3_112' },
        { label: '1:2:1', value: '3_121' },
        { label: '2:1:1', value: '3_211' },
      ],
      admin: {
        components: {
          Field: '@/components/ColumnLayoutPicker',
        },
      },
    },
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
                    BlogListBlockLexical,
                    ButtonsBlock,
                    DocumentBlock,
                    GenericEmbedLexical,
                    MediaBlock,
                    SingleBlogPostBlockLexical,
                    SponsorsBlockLexical,
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
