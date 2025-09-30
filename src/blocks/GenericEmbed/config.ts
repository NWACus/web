import alignContentField from '@/fields/alignContent'
import colorPickerField from '@/fields/color'
import type { Block, Field, RowField, TextareaField } from 'payload'

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

const htmlField: TextareaField = {
  name: 'html',
  label: 'HTML',
  type: 'textarea',
  required: true,
  admin: {
    description:
      'Helpful tip: <iframe> tags should have hardcoded height and width. You can use relative (100%) or pixel values (600px) for width. You must use pixel values for height.',
  },
}

export const GenericEmbed = genericEmbedWithFields([htmlField, colorAndAlignmentRow])

export const GenericEmbedLexical = genericEmbedWithFields([
  htmlField,
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
