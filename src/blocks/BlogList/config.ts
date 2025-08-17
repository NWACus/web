import { getTenantFilter } from '@/utilities/collectionFilters'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Block, FilterOptionsProps } from 'payload'
import { ButtonsBlock } from '../Buttons/config'

export const BlogListBlock: Block = {
  slug: 'blogList',
  interfaceName: 'BlogListBlock',
  // imageURL: '/thumbnail/ContentThumbnail.jpg',
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'belowHeadingContent',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            BlocksFeature({
              blocks: [ButtonsBlock],
            }),
            HorizontalRuleFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: 'Below Heading Content',
      admin: {
        description: 'Optional content to display below the heading and above the blog list.',
      },
    },
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
      admin: {
        description: 'Maximum number of posts that will be displayed.',
        step: 1,
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
  ],
}
