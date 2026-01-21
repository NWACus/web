import colorPickerField from '@/fields/color'
import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block, Field } from 'payload'

const defaultFields: Field[] = [
  colorPickerField('Background color'),
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

const singleBlogPostWithFields = (fields?: Field[]): Block => ({
  slug: 'singleBlogPost',
  interfaceName: 'SingleBlogPostBlock',
  imageURL: '/thumbnail/SingleBlogPostThumbnail.jpg',
  fields: [...defaultFields, ...(fields ?? [])],
})

export const SingleBlogPostBlock = singleBlogPostWithFields()

export const SingleBlogPostLexicalBlock = singleBlogPostWithFields([
  {
    name: 'wrapInContainer',
    admin: {
      description:
        'Checking this will render the block with additional padding around it and using the background color you have selected.',
    },
    type: 'checkbox',
    defaultValue: false,
  },
])
