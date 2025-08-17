import type { CollectionConfig } from 'payload'

import {
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { accessByTenantRoleOrReadPublished } from '@/access/byTenantRoleOrReadPublished'
import { filterByTenant } from '@/access/filterByTenant'
import { Banner } from '@/blocks/Banner/config'
import { Content } from '@/blocks/Content/config'
import { EventsByGroup } from '@/blocks/EventsByGroup/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { Tenant } from '@/payload-types'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { MetaDescriptionField, MetaImageField } from '@payloadcms/plugin-seo/fields'
import { revalidateDelete, revalidateEventGroup } from './hooks/revalidateEventGroup'

export const EventGroups: CollectionConfig<'event-groups'> = {
  slug: 'event-groups',
  access: accessByTenantRoleOrReadPublished('event-groups'),
  defaultPopulate: {
    excerpt: true,
    featuredImage: true,
    slug: true,
    title: true,
    _status: true,
  },
  admin: {
    group: 'Events',
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
          slug: `events/groups/${typeof data?.slug === 'string' ? data.slug : ''}`,
          collection: 'event-groups',
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
        slug: `events/groups/${typeof data?.slug === 'string' ? data.slug : ''}`,
        collection: 'event-groups',
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
    {
      name: 'excerpt',
      type: 'text',
      admin: {
        description: 'Short summary for cards and listings',
      },
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
    {
      name: 'description',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, HorizontalRuleFeature(), InlineToolbarFeature()]
        },
      }),
      admin: {
        description: 'Rich text description for group page header',
      },
    },
    {
      name: 'content',
      type: 'blocks',
      blocks: [Banner, Content, MediaBlock, EventsByGroup],
      admin: {
        description: 'Custom page content using blocks',
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        components: {
          Field: '@/components/ColorPicker',
        },
        description: 'Color for UI theming',
      },
    },

    // Sidebar
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
      type: 'tabs',
      tabs: [
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            MetaDescriptionField({
              hasGenerateFn: true,
            }),
          ],
        },
      ],
    },

    // @ts-expect-error Expect ts error here because of typescript mismatching Partial<TextField> with TextField
    slugField(),
    contentHashField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
    afterChange: [revalidateEventGroup],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
    maxPerDoc: 50,
  },
}
