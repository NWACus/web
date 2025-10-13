import colorPickerField from '@/fields/color'
import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block } from 'payload'

export const BiographyBlock: Block = {
  slug: 'biography',
  fields: [
    colorPickerField('Background color'),
    {
      name: 'biography',
      type: 'relationship',
      relationTo: 'biographies',
      hasMany: false,
      required: true,
      filterOptions: getTenantFilter,
    },
    {
      name: 'imageLayout',
      label: 'Which side should the image be on?',
      type: 'radio',
      options: [
        {
          label: 'Image left, bio right',
          value: 'left',
        },
        {
          label: 'Bio left, Image right',
          value: 'right',
        },
      ],
      defaultValue: 'left',
      required: true,
    },
  ],
  interfaceName: 'BiographyBlock',
  labels: {
    plural: 'Biographies',
    singular: 'Biography',
  },
  imageURL: '/thumbnail/BiographyThumbnail.jpg',
}
