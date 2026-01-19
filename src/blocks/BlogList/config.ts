import colorPickerField from '@/fields/color'
import { getTenantFilter } from '@/utilities/collectionFilters'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Block, Field, FilterOptionsProps } from 'payload'
import { ButtonBlock } from '../Button/config'
import { GenericEmbedLexicalBlock } from '../GenericEmbed/config'
import { MediaLexicalBlock } from '../MediaBlock/config'
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
            blocks: [ButtonBlock, MediaLexicalBlock, GenericEmbedLexicalBlock],
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
  {
    type: 'radio',
    name: 'postOptions',
    label: 'How do you want to choose your posts?',
    defaultValue: 'dynamic',
    required: true,
    options: [
      {
        label: 'Use filters',
        value: 'dynamic',
      },
      {
        label: 'Manually',
        value: 'static',
      },
    ],
  },
]
const dynamicPostRelatedFields: Field[] = [
  {
    name: 'dynamicOptions',
    type: 'group',
    label: 'Filter options',
    admin: {
      condition: (_, siblingData) => siblingData?.postOptions === 'dynamic',
    },
    fields: [
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
        name: 'maxPosts',
        type: 'number',
        label: 'Max Posts Displayed',
        min: 1,
        max: 20, // arbitrary but rendering more than 10 in this block's component seems like too much
        defaultValue: 4,
        admin: {
          description: 'Maximum number of posts that will be displayed. Must be an integer.',
          step: 1,
        },
        validate: validateMaxPosts,
      },
    ],
  },
]

const staticPostRelatedFields: Field[] = [
  {
    name: 'staticOptions',
    type: 'group',
    admin: {
      condition: (_, siblingData) => siblingData?.postOptions === 'static',
    },
    fields: [
      {
        name: 'staticPosts',
        type: 'relationship',
        label: 'Choose posts',
        relationTo: 'posts',
        hasMany: true,
        admin: {
          description: 'Choose new post from dropdown and/or drag and drop to change order',
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
  ...dynamicPostRelatedFields,
  ...staticPostRelatedFields,
])

export const BlogListLexicalBlock = blogListBlockWithFields([
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
  ...dynamicPostRelatedFields,
  ...staticPostRelatedFields,
])
