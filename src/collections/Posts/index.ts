import { Tenant } from '@/payload-types'
import { MetaDescriptionField, MetaImageField } from '@payloadcms/plugin-seo/fields'
import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { Banner } from '@/blocks/Banner/config'
import { BlogListBlockLexical } from '@/blocks/BlogList/config'
import { DocumentBlock } from '@/blocks/DocumentBlock/config'
import { EventListBlockLexical } from '@/blocks/EventList/config'
import { GenericEmbedLexical } from '@/blocks/GenericEmbed/config'
import { HeaderBlock } from '@/blocks/Header/config'
import { MediaBlockLexical } from '@/blocks/MediaBlock/config'
import { SingleBlogPostBlockLexical } from '@/blocks/SingleBlogPost/config'
import { SingleEventBlockLexical } from '@/blocks/SingleEvent/config'
import { SponsorsBlock } from '@/blocks/SponsorsBlock/config'

import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { getTenantAndIdFilter, getTenantFilter } from '@/utilities/collectionFilters'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { populateBlocksInContent } from './hooks/populateBlocksInContent'
import { revalidatePost, revalidatePostDelete } from './hooks/revalidatePost'

import { accessByTenantRoleOrReadPublished } from '@/access/byTenantRoleOrReadPublished'
import { filterByTenant } from '@/access/filterByTenant'
import { ButtonBlock } from '@/blocks/Button/config'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'

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
    components: {
      edit: {
        beforeDocumentControls: ['@/collections/Posts/components/ViewPostButton#ViewPostButton'],
      },
    },
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
      relationTo: 'media',
      overrides: {
        admin: {
          allowCreate: true,
        },
        name: 'featuredImage',
        label: 'Featured image',
      },
    }),
    MetaDescriptionField({}),
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            BlocksFeature({
              blocks: [
                ButtonBlock,
                Banner,
                BlogListBlockLexical,
                DocumentBlock,
                EventListBlockLexical,
                GenericEmbedLexical,
                HeaderBlock,
                MediaBlockLexical,
                SingleBlogPostBlockLexical,
                SingleEventBlockLexical,
                SponsorsBlock,
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
      filterOptions: getTenantFilter,
    },
    {
      name: 'showAuthors',
      type: 'checkbox',
      label: 'Show authors on post?',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
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
      name: 'showDate',
      type: 'checkbox',
      label: 'Show published date on post?',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'slug',
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
