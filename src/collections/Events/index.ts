import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { accessByTenantRoleOrReadPublished } from '@/access/byTenantRoleOrReadPublished'
import { filterByTenant } from '@/access/filterByTenant'
import { Banner } from '@/blocks/Banner/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { Tenant } from '@/payload-types'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { MetaDescriptionField, MetaImageField } from '@payloadcms/plugin-seo/fields'
import { revalidateDelete, revalidateEvent } from './hooks/revalidateEvent'
import { setEventTypeDefaults } from './hooks/setEventTypeDefaults'

export const Events: CollectionConfig<'events'> = {
  slug: 'events',
  access: accessByTenantRoleOrReadPublished('events'),
  defaultPopulate: {
    excerpt: true,
    featuredImage: true,
    slug: true,
    title: true,
    startDate: true,
    eventGroups: true,
    eventType: true,
    _status: true,
  },
  admin: {
    group: 'Events',
    defaultColumns: ['title', 'startDate', 'eventType', 'slug', 'updatedAt'],
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
          collection: 'events',
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
        collection: 'events',
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
      name: 'subtitle',
      type: 'text',
      admin: {
        description: 'Optional subtitle for the event',
      },
    },
    {
      name: 'excerpt',
      type: 'text',
      admin: {
        description: 'Short summary for cards',
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
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            BlocksFeature({ blocks: [Banner, MediaBlock] }),
            HorizontalRuleFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      required: true,
      admin: {
        description: 'Full event description',
      },
    },

    // Scheduling
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Optional end date for multi-day events',
      },
    },
    {
      name: 'timezone',
      type: 'text',
      admin: {
        description: 'Event timezone (e.g., "America/Los_Angeles")',
      },
    },

    // Location
    {
      name: 'location',
      type: 'group',
      fields: [
        {
          name: 'isOnline',
          type: 'checkbox',
          admin: {
            description: 'Check if this is an online/virtual event',
          },
        },
        {
          name: 'venue',
          type: 'text',
          admin: {
            description: 'Venue name',
            condition: (data, siblingData) => !siblingData?.isOnline,
          },
        },
        {
          name: 'address',
          type: 'text',
          admin: {
            description: 'Street address',
            condition: (data, siblingData) => !siblingData?.isOnline,
          },
        },
        {
          name: 'city',
          type: 'text',
          admin: {
            description: 'City',
            condition: (data, siblingData) => !siblingData?.isOnline,
          },
        },
        {
          name: 'state',
          type: 'text',
          admin: {
            description: 'State',
            condition: (data, siblingData) => !siblingData?.isOnline,
          },
        },
        {
          name: 'zip',
          type: 'text',
          admin: {
            description: 'ZIP code',
            condition: (data, siblingData) => !siblingData?.isOnline,
          },
        },
        {
          name: 'extraInfo',
          type: 'text',
          admin: {
            description: 'Extra location info (e.g., "Meet in lot 4")',
          },
        },
        {
          name: 'virtualUrl',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.isOnline,
            description: 'Meeting link for virtual events',
          },
        },
      ],
    },

    // Registration & Links
    {
      name: 'registrationUrl',
      type: 'text',
      admin: {
        description: 'External registration link',
      },
    },
    {
      name: 'externalEventUrl',
      type: 'text',
      admin: {
        description: 'Optional external landing page (takes precedence over event page)',
      },
    },
    {
      name: 'registrationDeadline',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Registration cutoff',
      },
    },
    {
      name: 'capacity',
      type: 'number',
      admin: {
        description: 'Maximum attendees',
      },
    },
    {
      name: 'cost',
      type: 'number',
      admin: {
        description: 'Event cost in dollars',
      },
    },
    {
      name: 'skillRating',
      type: 'select',
      options: [
        { label: '0 - Beginner Friendly', value: '0' },
        { label: '1 - Previous Knowledge Helpful', value: '1' },
        { label: '2 - Prerequisites Required', value: '2' },
        { label: '3 - Professional Level', value: '3' },
      ],
      admin: {
        description: 'Skill level required for this event',
      },
    },

    // Sidebar relationships
    {
      name: 'eventGroups',
      type: 'relationship',
      relationTo: 'event-groups',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
      filterOptions: getTenantFilter,
    },
    {
      name: 'eventType',
      type: 'relationship',
      relationTo: 'event-types',
      admin: {
        position: 'sidebar',
      },
      filterOptions: getTenantFilter,
    },
    {
      name: 'instructors',
      type: 'relationship',
      relationTo: 'biographies',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
      filterOptions: getTenantFilter,
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
    beforeChange: [populatePublishedAt, setEventTypeDefaults],
    afterChange: [revalidateEvent],
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
