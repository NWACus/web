import alignContentField from '@/fields/alignContent'
import colorPickerField from '@/fields/color'
import type { Block, Field, RowField } from 'payload'

const genericEmbedWithFields = (fields: Field[]): Block => ({
  slug: 'genericEmbed',
  imageURL: '/thumbnail/GenericEmbedThumbnail.jpg',
  fields,
  interfaceName: 'GenericEmbedBlock',
})

const colorAndAlignmentRow: RowField = {
  type: 'row',
  fields: [colorPickerField('Background color'), alignContentField('Content alignment')],
}

export const GenericEmbed = genericEmbedWithFields([
  {
    name: 'html',
    label: 'HTML',
    type: 'textarea',
    required: true,
  },
  colorAndAlignmentRow,
])

export const GenericEmbedLexical = genericEmbedWithFields([
  {
    name: 'html',
    label: 'HTML',
    type: 'textarea',
    required: true,
  },
  {
    name: 'wrapInContainer',
    admin: {
      description:
        'Checking this will render the embed with additional padding around it and using the background color you have selected.',
    },
    type: 'checkbox',
    defaultValue: false,
  },
  colorAndAlignmentRow,
])
