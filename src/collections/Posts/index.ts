import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { Banner } from '@/blocks/Banner/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { populateBlocksInContent } from './hooks/populateBlocksInContent'
import { revalidatePost, revalidatePostDelete } from './hooks/revalidatePost'

import { accessByTenantRoleOrReadPublished } from '@/access/byTenantRoleOrReadPublished'
import { filterByTenant } from '@/access/filterByTenant'
import { BlogListBlockLexical } from '@/blocks/BlogList/config'
import { GenericEmbedLexical } from '@/blocks/GenericEmbed/config'
import { SingleBlogPostBlockLexical } from '@/blocks/SingleBlogPost/config'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { Tenant } from '@/payload-types'
import { getTenantAndIdFilter, getTenantFilter } from '@/utilities/collectionFilters'
import { MetaDescriptionField, MetaImageField } from '@payloadcms/plugin-seo/fields'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  access: accessByTenantRoleOrReadPublished('posts'),
  defaultPopulate: {
    description: true,
    featuredImage: true,
    slug: true,
    title: true,
    _status: true,
    publishedAt: true,
    authors: true,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    baseListFilter: filterByTenant,
    livePreview: {
      url: async ({ data, req }) => {
        let tenant = data.tenant

        if (typeof tenant === 'number') {
          tenant = await req.payload.findByID({
            collection: 'tenants',
            id: tenant,
            depth: 2,
          })
        }

        const path = generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: 'posts',
          tenant,
          req,
        })

        return path
      },
    },
    preview: (data, { req }) => {
      const tenant =
        data?.tenant &&
        typeof data.tenant === 'object' &&
        'id' in data.tenant &&
        'slug' in data.tenant
          ? (data.tenant as Tenant)
          : null
      return generatePreviewPath({
        slug: typeof data?.slug === 'string' ? data.slug : '',
        collection: 'posts',
        tenant,
        req,
      })
    },
    useAsTitle: 'title',
  },
  fields: [
    tenantField(),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    MetaImageField({
      hasGenerateFn: true,
      relationTo: 'media',
      overrides: {
        admin: {
          allowCreate: true,
        },
        name: 'featuredImage',
        label: 'Featured image',
      },
    }),
    MetaDescriptionField({
      hasGenerateFn: true,
    }),
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            BlocksFeature({
              blocks: [
                Banner,
                BlogListBlockLexical,
                GenericEmbedLexical,
                MediaBlock,
                SingleBlogPostBlockLexical,
              ],
            }),
            HorizontalRuleFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      required: true,
    },

    // Sidebar
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'biographies',
      required: true,
      filterOptions: getTenantFilter,
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'tags',
      filterOptions: getTenantFilter,
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      filterOptions: getTenantAndIdFilter,
      hasMany: true,
      relationTo: 'posts',
    },
    // Hidden field to track blocks embedded in content for revalidation purposes
    {
      name: 'blocksInContent',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'blockType',
          type: 'text',
        },
        {
          name: 'collection',
          type: 'text',
        },
        {
          name: 'docId',
          type: 'number',
        },
      ],
    },
    // @ts-expect-error Expect ts error here because of typescript mismatching Partial<TextField> with TextField
    slugField(),
    contentHashField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt, populateBlocksInContent],
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidatePostDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
    },
    maxPerDoc: 50,
  },
}
