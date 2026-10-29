import colorPickerField from '@/fields/color'
import { layoutField } from '@/fields/layout'
import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block, Field } from 'payload'

const defaultFields: Field[] = [
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
]

export const SingleBlogPostBlock: Block = {
  slug: 'singleBlogPost',
  interfaceName: 'SingleBlogPostBlock',
  imageURL: '/thumbnail/SingleBlogPostThumbnail.jpg',
  fields: [...defaultFields, layoutField([colorPickerField('Background color')])],
}
