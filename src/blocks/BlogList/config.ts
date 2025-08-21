import colorPickerField from '@/fields/color'
import { getTenantFilter } from '@/utilities/collectionFilters'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Block, Field, FilterOptionsProps } from 'payload'
import { ButtonsBlock } from '../Buttons/config'
import { GenericEmbedLexical } from '../GenericEmbed/config'
import { MediaBlock } from '../MediaBlock/config'
import { validateMaxPosts } from './hooks/validateMaxPosts'

const defaultStylingFields: Field[] = [
  { name: 'heading', type: 'text' },
  {
    name: 'belowHeadingContent',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          BlocksFeature({
            blocks: [ButtonsBlock, MediaBlock, GenericEmbedLexical],
          }),
          HorizontalRuleFeature(),
          InlineToolbarFeature(),
        ]
      },
    }),
    label: 'Content Below Heading',
    admin: {
      description: 'Optional content to display below the heading and above the blog list.',
    },
  },
  colorPickerField('Background color'),
]
const defaultPostRelatedFields: Field[] = [
  {
    name: 'filterByTags',
    type: 'relationship',
    relationTo: 'tags',
    hasMany: true,
    filterOptions: getTenantFilter,
    label: 'Filter by Tag(s)',
    admin: {
      description: 'Optionally select tags to filter posts in this list by.',
    },
  },
  {
    name: 'sortBy',
    type: 'select',
    defaultValue: '-publishedAt',
    options: [
      { label: 'Newest to Oldest', value: '-publishedAt' },
      { label: 'Oldest to Newest', value: 'publishedAt' },
    ],
    required: true,
    admin: {
      description: 'Select how the list of posts will be sorted.',
    },
  },
  {
    name: 'maxPosts',
    type: 'number',
    label: 'Max Posts Displayed',
    min: 1,
    max: 10, // arbitrary but rendering more than 10 in this block's component seems like too much
    defaultValue: 4,
    admin: {
      description: 'Maximum number of posts that will be displayed. Must be an integer.',
      step: 1,
    },
    hooks: {
      beforeValidate: [validateMaxPosts],
    },
  },
  {
    name: 'queriedPosts',
    type: 'relationship',
    relationTo: 'posts',
    hasMany: true,
    admin: {
      readOnly: true,
      components: {
        Field: '@/blocks/BlogList/fields/QueriedPostsComponent#QueriedPostsComponent',
      },
    },
  },
  {
    name: 'staticPosts',
    type: 'relationship',
    relationTo: 'posts',
    hasMany: true,
    admin: {
      description:
        'Use this to select specific posts to display here instead of displaying a dynamic list of posts based on tags, sort by, and max posts.',
    },
    filterOptions: (props: FilterOptionsProps) => ({
      and: [
        getTenantFilter(props),
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    }),
  },
]

const blogListBlockWithFields = (fields: Field[]): Block => ({
  slug: 'blogList',
  interfaceName: 'BlogListBlock',
  imageURL: '/thumbnail/BlogListThumbnail.jpg',
  fields,
})

export const BlogListBlock = blogListBlockWithFields([
  ...defaultStylingFields,
  ...defaultPostRelatedFields,
])

export const BlogListBlockLexical = blogListBlockWithFields([
  ...defaultStylingFields,
  {
    name: 'wrapInContainer',
    admin: {
      description:
        'Checking this will render the block with additional padding around it and using the background color you have selected.',
    },
    type: 'checkbox',
    defaultValue: false,
  },
  ...defaultPostRelatedFields,
])
