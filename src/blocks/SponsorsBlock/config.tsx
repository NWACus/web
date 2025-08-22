import colorPickerField from '@/fields/color'
import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block } from 'payload'

export const SponsorsBlock: Block = {
  slug: 'sponsors',
  interfaceName: 'SponsorsBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    colorPickerField('Title background color'),
    {
      name: 'sponsors',
      type: 'relationship',
      relationTo: 'sponsors',
      hasMany: true,
      required: true,
      filterOptions: getTenantFilter,
    },
  ],
  imageURL: '/thumbnail/SponsorsThumbnail.jpg',
}
