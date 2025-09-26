import alignContentField from '@/fields/alignContent'
import colorPickerField from '@/fields/color'
import { InlineToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Block, Field, RowField } from 'payload'

const colorAndAlignmentRow: RowField = {
  type: 'row',
  fields: [colorPickerField('Background color'), alignContentField('Content alignment')],
}

const defaultFields: Field[] = [
  {
    name: 'media',
    type: 'upload',
    relationTo: 'media',
    required: true,
  },
  {
    name: 'caption',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [...rootFeatures, InlineToolbarFeature()]
      },
    }),
    admin: {
      description:
        'Optional text that appears below the image to provide additional context or information about the image content.',
    },
  },
  colorAndAlignmentRow,
]

const mediaBlockWithFields = (fields?: Field[]): Block => ({
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  imageURL: '/thumbnail/MediaThumbnail.jpg',
  fields: [...defaultFields, ...(fields ?? [])],
})

export const MediaBlock = mediaBlockWithFields()

export const MediaBlockLexical = mediaBlockWithFields([
  {
    name: 'wrapInContainer',
    admin: {
      description:
        'Checking this will render the block with additional padding around it and using the background color you have selected.',
    },
    type: 'checkbox',
    defaultValue: false,
  },
])
