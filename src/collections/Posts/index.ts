import { Tenant } from '@/payload-types'
import { MetaDescriptionField, MetaImageField } from '@payloadcms/plugin-seo/fields'
import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { BlogListLexicalBlock } from '@/blocks/BlogList/config'
import { ButtonBlock } from '@/blocks/Button/config'
import { DocumentBlock } from '@/blocks/Document/config'
import { EventListLexicalBlock } from '@/blocks/EventList/config'
import { EventTableLexicalBlock } from '@/blocks/EventTable/config'
import { GenericEmbedLexicalBlock } from '@/blocks/GenericEmbed/config'
import { HeaderBlock } from '@/blocks/Header/config'
import { MediaLexicalBlock } from '@/blocks/Media/config'
import { SingleBlogPostLexicalBlock } from '@/blocks/SingleBlogPost/config'
import { SingleEventLexicalBlock } from '@/blocks/SingleEvent/config'
import { SponsorsBlock } from '@/blocks/Sponsors/config'

import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { getTenantAndIdFilter, getTenantFilter } from '@/utilities/collectionFilters'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { populateBlocksInContent } from './hooks/populateBlocksInContent'
import { revalidatePost, revalidatePostDelete } from './hooks/revalidatePost'

import { accessByTenantRoleOrReadPublished } from '@/access/byTenantRoleOrReadPublished'
import { filterByTenant } from '@/access/filterByTenant'

import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { titleField } from '@/fields/title'
import { isTenantValue } from '@/utilities/isTenantValue'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  access: accessByTenantRoleOrReadPublished('posts'),
  defaultPopulate: {
    _status: true,
    authors: true,
    description: true,
    featuredImage: true,
    publishedAt: true,
    showAuthors: true,
    showDate: true,
    slug: true,
    title: true,
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
        let tenant: Partial<Tenant> | null = null

        if (isTenantValue(data.tenant)) {
          tenant = await resolveTenant(data.tenant)
        }

        return generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: 'posts',
          tenant,
          req,
        })
      },
    },
    preview: async (data, { req }) => {
      let tenant: Partial<Tenant> | null = null

      if (isTenantValue(data.tenant)) {
        tenant = await resolveTenant(data.tenant)
      }

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
    titleField(),
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
                BlogListLexicalBlock,
                DocumentBlock,
                EventListLexicalBlock,
                EventTableLexicalBlock,
                GenericEmbedLexicalBlock,
                HeaderBlock,
                MediaLexicalBlock,
                SingleBlogPostLexicalBlock,
                SingleEventLexicalBlock,
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
    drafts: true,
    maxPerDoc: 50,
  },
}
