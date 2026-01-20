import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block } from 'payload'

export const TeamBlock: Block = {
  slug: 'team',
  interfaceName: 'TeamBlock',
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
  labels: {
    plural: 'Teams',
    singular: 'Team',
  },
  imageURL: '/thumbnail/TeamThumbnail.jpg',
}
