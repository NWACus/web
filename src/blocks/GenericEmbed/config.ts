import alignContentField from '@/fields/alignContent'
import colorPickerField from '@/fields/color'
import type { Block } from 'payload'

export const GenericEmbedBlock: Block = {
  slug: 'genericEmbed',
  imageURL: '/thumbnail/GenericEmbedThumbnail.jpg',
  interfaceName: 'GenericEmbedBlock',
  labels: {
    singular: 'Generic Embed',
    plural: 'Generic Embeds',
  },
  fields: [
    {
      name: 'html',
      label: 'HTML',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'For arbitrary HTML/iframe embeds. For videos use the Video Embed block, and for donation or form widgets (DonorBox, etc.) use the Form Embed block. Helpful tip: <iframe> tags should have hardcoded height and width. You can use relative (100%) or pixel values (600px) for width. You must use pixel values for height.',
      },
    },
    {
      type: 'row',
      fields: [colorPickerField('Background color'), alignContentField('Content alignment')],
    },
  ],
}
