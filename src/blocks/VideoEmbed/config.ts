import alignContentField from '@/fields/alignContent'
import colorPickerField from '@/fields/color'
import type { Block } from 'payload'

export const VideoEmbedBlock: Block = {
  slug: 'videoEmbed',
  imageURL: '/thumbnail/GenericEmbedThumbnail.jpg',
  interfaceName: 'VideoEmbedBlock',
  labels: {
    singular: 'Video Embed',
    plural: 'Video Embeds',
  },
  fields: [
    {
      name: 'html',
      label: 'Video embed code',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'Paste the embed code (<iframe>) from a video provider such as YouTube or Vimeo. Scripts are not executed in this block. Helpful tip: <iframe> tags should have hardcoded height and width. You can use relative (100%) or pixel values (600px) for width. You must use pixel values for height.',
      },
    },
    {
      type: 'row',
      fields: [colorPickerField('Background color'), alignContentField('Content alignment')],
    },
  ],
}
