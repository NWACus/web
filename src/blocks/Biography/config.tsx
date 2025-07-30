import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block } from 'payload'

export const BiographyBlock: Block = {
  slug: 'biography',
  fields: [
    {
      name: 'biography',
      type: 'relationship',
      relationTo: 'biographies',
      hasMany: false,
      required: true,
      filterOptions: getTenantFilter,
    },
  ],
  interfaceName: 'BiographyBlock',
  labels: {
    plural: 'Biographies',
    singular: 'Biography',
  },
  imageURL: '/thumbnail/BiographyThumbnail.jpg',
}
