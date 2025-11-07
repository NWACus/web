import type { Block, SelectFieldValidation } from 'payload'

import colorPickerField from '@/fields/color'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { BlogListBlockLexical } from '../BlogList/config'
import { ButtonBlock } from '../Button/config'
import { CalloutBlock } from '../Callout/config'
import { DocumentBlock } from '../DocumentBlock/config'
import { EventListBlockLexical } from '../EventList/config'
import { GenericEmbedLexical } from '../GenericEmbed/config'
import { HeaderBlock } from '../Header/config'
import { MediaBlockLexical } from '../MediaBlock/config'
import { SingleBlogPostBlockLexical } from '../SingleBlogPost/config'
import { SingleEventBlockLexical } from '../SingleEvent/config'
import { SponsorsBlock } from '../SponsorsBlock/config'

const validateColumnLayout: SelectFieldValidation = (value, { siblingData }) => {
  if (!value || typeof value !== 'string') return true
  if (
    siblingData &&
    typeof siblingData === 'object' &&
    'columns' in siblingData &&
    Array.isArray(siblingData.columns)
  ) {
    const numOfCols = siblingData.columns?.length ?? 0
    const selectedColCount = parseInt(value.split('_')[0])

    if (selectedColCount !== numOfCols) {
      // TODO - figure out why error is not showing with custom field
      return `Selected layout requires ${selectedColCount} column${selectedColCount !== 1 ? 's' : ''}, but ${numOfCols} column${numOfCols !== 1 ? 's' : ''} exist${numOfCols === 1 ? 's' : ''}`
    }
  }

  return true
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

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  imageURL: '/thumbnail/ContentThumbnail.jpg',
  fields: [
    // Background color
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
      validate: validateColumnLayout,
    },
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
      label: false,
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
                    BlogListBlockLexical,
                    ButtonBlock,
                    CalloutBlock,
                    DocumentBlock,
                    EventListBlockLexical,
                    SingleEventBlockLexical,
                    GenericEmbedLexical,
                    HeaderBlock,
                    MediaBlockLexical,
                    SingleBlogPostBlockLexical,
                    SponsorsBlock,
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
