import type { Block, Field } from 'payload'

import colorPickerField from '@/fields/color'
import { layoutField } from '@/fields/layout'
import {
  AlignFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

const defaultFields: Field[] = [
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
]

const headerBlockWithFields = (layoutFields?: Field[]): Block => ({
  slug: 'headerBlock',
  interfaceName: 'HeaderBlock',
  imageURL: '/thumbnail/HeaderThumbnail.jpg',
  fields: [
    ...defaultFields,
    layoutField([colorPickerField('Background color'), ...(layoutFields ?? [])]),
  ],
})

export const HeaderBlock = headerBlockWithFields([
  {
    name: 'fullWidthColor',
    admin: {
      description: 'Makes background color the full width of the page',
    },
    type: 'checkbox',
    defaultValue: true,
  },
])

export const HeaderLexicalBlock = headerBlockWithFields()
