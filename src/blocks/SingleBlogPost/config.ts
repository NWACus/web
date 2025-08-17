import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block } from 'payload'

export const SingleBlogPostBlock: Block = {
  slug: 'singleBlogPost',
  interfaceName: 'SingleBlogPostBlock',
  // imageURL: '/thumbnail/ContentThumbnail.jpg',
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      admin: {
        description: 'Select a blog post to display',
      },
      filterOptions: getTenantFilter,
    },
  ],
}
