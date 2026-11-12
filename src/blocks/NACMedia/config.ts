import type { Block } from 'payload'

import colorPickerField from '@/fields/color'
import { layoutField } from '@/fields/layout'

export const NACMediaBlock: Block = {
  slug: 'nacMediaBlock',
  interfaceName: 'NACMediaBlock',
  labels: {
    singular: 'NAC Media Block',
    plural: 'NAC Media Blocks',
  },
  imageURL: '/thumbnail/NACMediaBlockThumbnail.jpg',
  fields: [
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
    layoutField([colorPickerField('Background color')]),
  ],
}
