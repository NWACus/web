import colorPickerField from '@/fields/color'
import type { Block, Field } from 'payload'

const genericEmbedWithFields = (fields: Field[]) => ({
  slug: 'genericEmbed',
  imageURL: '/thumbnail/GenericEmbedThumbnail.jpg',
  fields,
  interfaceName: 'GenericEmbedBlock',
})

export const GenericEmbed: Block = genericEmbedWithFields([
  colorPickerField('Background color'),
  {
    name: 'html',
    label: 'HTML',
    type: 'textarea',
    required: true,
  },
])

export const GenericEmbedLexical: Block = genericEmbedWithFields([
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
  colorPickerField('Background color'),
])
