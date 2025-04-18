import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

const columnFields: Field[] = [
  {
    name: 'image',
    type: 'upload',
    relationTo: 'media',
    required: true,
    filterOptions: {
      mimeType: { contains: 'image' },
    },
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
    required: true,
  },
]

export const ImageTextList: Block = {
  slug: 'imageTextList',
  interfaceName: 'ImageTextList',
  fields: [
    {
      name: 'columns',
      label: 'Image with text columns',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: columnFields,
      maxRows: 4,
    },
  ],
}
