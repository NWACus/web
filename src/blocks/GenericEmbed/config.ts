import colorPickerField from '@/fields/color'
import type { Block } from 'payload'

export const GenericEmbed: Block = {
  slug: 'genericEmbed',
  fields: [
    colorPickerField('Background color'),
    {
      name: 'html',
      label: 'HTML',
      type: 'textarea',
      required: true,
    },
  ],
  interfaceName: 'GenericEmbedBlock',
}
