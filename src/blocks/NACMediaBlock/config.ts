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
