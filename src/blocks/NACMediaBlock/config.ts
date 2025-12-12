import type { Block } from 'payload'

import colorPickerField from '@/fields/color'

export const NACMediaBlock: Block = {
  slug: 'nacMediaBlock',
  interfaceName: 'NACMediaBlock',
  labels: {
    singular: 'NAC Media Block',
    plural: 'NAC Media Blocks',
  },
  imageURL: '/thumbnail/NACMediaBlockThumbnail.jpg',
  fields: [
    colorPickerField('Background color'),
    {
      name: 'wrapInContainer',
      admin: {
        description:
          'Checking this will render the block with additional padding around it and using the background color you have selected.',
      },
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'mode',
      type: 'radio',
      options: [
        { label: 'Carousel', value: 'carousel' },
        { label: 'Grid', value: 'grid' },
      ],
      required: true,
      defaultValue: 'carousel',
    },
  ],
}
