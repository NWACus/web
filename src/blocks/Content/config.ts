import type { Block, SelectFieldValidation } from 'payload'

import { DEFAULT_INLINE_BLOCKS } from '@/constants/defaultInlineBlocks'
import colorPickerField from '@/fields/color'
import { layoutField } from '@/fields/layout'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { select } from 'payload/shared'
import { BlogListBlock } from '../BlogList/config'
import { ButtonBlock } from '../Button/config'
import { CalloutBlock } from '../Callout/config'
import { DocumentBlock } from '../Document/config'
import { EventListBlock } from '../EventList/config'
import { EventTableBlock } from '../EventTable/config'
import { FormEmbedBlock } from '../FormEmbed/config'
import { GenericEmbedBlock } from '../GenericEmbed/config'
import { HeaderLexicalBlock } from '../Header/config'
import { MediaBlock } from '../Media/config'
import { SingleBlogPostBlock } from '../SingleBlogPost/config'
import { SingleEventBlock } from '../SingleEvent/config'
import { SponsorsBlock } from '../Sponsors/config'
import { VideoEmbedBlock } from '../VideoEmbed/config'
import { healColumnLayout } from './hooks/healColumnLayout'

const pluralColumns = (count: number) => `${count} column${count !== 1 ? 's' : ''}`

const siblingColumnCount = (siblingData: unknown) => {
  if (siblingData && typeof siblingData === 'object' && 'columns' in siblingData) {
    if (Array.isArray(siblingData.columns)) return siblingData.columns.length
  }
}

const validateColumnLayout: SelectFieldValidation = (value, args) => {
  const numOfCols = siblingColumnCount(args.siblingData)
  if (typeof value !== 'string' || !value || numOfCols === undefined) return select(value, args)

  const selectedColCount = parseInt(value.split('_')[0])
  if (selectedColCount !== numOfCols) {
    return `Selected layout requires ${pluralColumns(selectedColCount)}, but ${pluralColumns(numOfCols)} exist${numOfCols === 1 ? 's' : ''}`
  }

  return select(value, args)
}

const DEFAULT_LEXICAL_NODE = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [],
        direction: 'ltr',
        textStyle: '',
        textFormat: 0,
      },
    ],
    direction: 'ltr',
  },
}

export const ContentBlock: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  imageURL: '/thumbnail/ContentThumbnail.jpg',
  fields: [
    {
      type: 'ui',
      name: 'defaultColumnAdder',
      admin: {
        components: {
          Field: '@/blocks/Content/components/DefaultColumnAdder#DefaultColumnAdder',
        },
      },
    },
    {
      name: 'columns',
      label: 'Columns',
      labels: {
        plural: 'Columns',
        singular: 'Column',
      },
      required: true,
      type: 'array',
      admin: {
        initCollapsed: false,
      },
      maxRows: 4,
      minRows: 1,
      fields: [
        {
          name: 'richText',
          type: 'richText',
          defaultValue: DEFAULT_LEXICAL_NODE,
          editor: lexicalEditor({
            features: ({ rootFeatures }) => {
              return [
                ...rootFeatures,
                BlocksFeature({
                  blocks: [
                    BlogListBlock,
                    ButtonBlock,
                    CalloutBlock,
                    DocumentBlock,
                    EventListBlock,
                    EventTableBlock,
                    SingleEventBlock,
                    GenericEmbedBlock,
                    FormEmbedBlock,
                    VideoEmbedBlock,
                    HeaderLexicalBlock,
                    MediaBlock,
                    SingleBlogPostBlock,
                    SponsorsBlock,
                  ],
                  inlineBlocks: DEFAULT_INLINE_BLOCKS,
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
    layoutField([
      {
        type: 'row',
        fields: [
          colorPickerField('Background color'),
          {
            name: 'layout',
            label: 'Column layout',
            type: 'select',
            required: true,
            defaultValue: '1_1',
            options: [
              { label: 'full', value: '1_1' },
              { label: '1:1', value: '2_11' },
              { label: '1:1:1', value: '3_111' },
              { label: '2:1', value: '2_21' },
              { label: '1:2', value: '2_12' },
              { label: '1:1:1:1', value: '4_1111' },
              { label: '2:1:1', value: '3_211' },
              { label: '1:2:1', value: '3_121' },
              { label: '1:1:2', value: '3_112' },
            ],
            admin: {
              components: {
                Field: '@/components/ColumnLayoutPicker#ColumnLayoutPicker',
              },
            },
            validate: validateColumnLayout,
            hooks: {
              beforeChange: [healColumnLayout],
            },
          },
          {
            name: 'verticalAlignment',
            label: 'Vertical alignment',
            type: 'select',
            required: true,
            defaultValue: 'top',
            options: [
              { label: 'Top', value: 'top' },
              { label: 'Middle', value: 'center' },
              { label: 'Bottom', value: 'bottom' },
              { label: 'Stretch', value: 'stretch' },
            ],
            admin: {
              components: {
                Field: '@/components/VerticalAlignmentPicker#VerticalAlignmentPicker',
              },
            },
          },
        ],
      },
    ]),
  ],
}
