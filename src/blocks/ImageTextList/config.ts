import type { Block, Field } from 'payload'
import thumb from './ImageTextList.jpg'

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
  imageURL: `${thumb.src}`,
  fields: [
    {
      name: 'layout',
      label: 'Which do you want to use?',
      type: 'radio',
      options: [
        {
          label: 'Images above text',
          value: 'above',
        },
        {
          label: 'Images to the side of text',
          value: 'side',
        },
        {
          label: 'Image and text are full width',
          value: 'full',
        },
      ],
      defaultValue: 'above',
      required: true,
    },
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
