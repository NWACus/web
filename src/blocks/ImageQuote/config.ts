import type { Block } from 'payload'

import colorPickerField from '@/fields/color'

export const ImageQuote: Block = {
  slug: 'imageQuote',
  interfaceName: 'ImageQuote',
  imageURL: '/thumbnail/ImageQuoteThumbnail.jpg',
  fields: [
    colorPickerField('Background color'),
    {
      name: 'imageLayout',
      label: 'Which side should the image be on?',
      type: 'radio',
      options: [
        {
          label: 'Image left, text right',
          value: 'left',
        },
        {
          label: 'Text left, Image right',
          value: 'right',
        },
      ],
      defaultValue: 'left',
      required: true,
    },
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
      name: 'quote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
      required: true,
    },
  ],
}
