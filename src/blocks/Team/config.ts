import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block } from 'payload'

export const TeamBlock: Block = {
  slug: 'team',
  fields: [
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      hasMany: false,
      required: true,
      filterOptions: getTenantFilter,
    },
  ],
  interfaceName: 'TeamBlock',
  labels: {
    plural: 'Teams',
    singular: 'Team',
  },
  imageURL: '/thumbnail/TeamThumbnail.jpg',
}
