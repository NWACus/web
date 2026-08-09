import alignContentField from '@/fields/alignContent'
import colorPickerField from '@/fields/color'
import type { Block } from 'payload'

export const FormEmbedBlock: Block = {
  slug: 'formEmbed',
  imageURL: '/thumbnail/FormThumbnail.jpg',
  interfaceName: 'FormEmbedBlock',
  labels: {
    singular: 'Form Embed',
    plural: 'Form Embeds',
  },
  fields: [
    {
      name: 'html',
      label: 'Form embed code',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'For donation and form widgets that ship their own scripts (DonorBox, Classy, Eventbrite, etc.). Paste the provider embed code, including any <script> tags. Helpful tip: <iframe> tags should have hardcoded height and width. You can use relative (100%) or pixel values (600px) for width. You must use pixel values for height.',
      },
    },
    {
      type: 'row',
      fields: [colorPickerField('Background color'), alignContentField('Content alignment')],
    },
  ],
}
