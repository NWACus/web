import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

const columnFields: Field[] = [
  {
    name: 'icon',
    type: 'upload',
    relationTo: 'media',
    required: true,
  },
  {
    name: 'title',
    type: 'text',
    required: true,
  },
  {
    name: 'richText',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
      },
    }),
    label: false,
  },
]

export const IconList: Block = {
  slug: 'iconList',
  interfaceName: 'IconList',
  fields: [
    {
      name: 'columns',
      label: 'Icons with text',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: columnFields,
      maxRows: 4,
    },
  ],
}
