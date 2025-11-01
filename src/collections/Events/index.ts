import { accessByProviderOrTenantRole } from '@/access/byProviderOrTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
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
import { contentHashField } from '@/fields/contentHashField'
import { locationField } from '@/fields/location'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import {
  hasGlobalOrTenantRolePermission,
  hasTenantRolePermission,
} from '@/utilities/rbac/hasGlobalOrTenantRolePermission'
import { hasProviderAccess } from '@/utilities/rbac/hasProviderAccess'
import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import { MetaImageField } from '@payloadcms/plugin-seo/fields'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { CollectionConfig } from 'payload'
import { populateBlocksInContent } from '../Posts/hooks/populateBlocksInContent'
import { eventSubTypesData, eventTypesData } from './constants'
import { validateEvent } from './hooks/validateEvent'

const typesWithSubTypes = [...new Set(eventSubTypesData.map((item) => item.eventType))]

export const Events: CollectionConfig = {
  slug: 'events',
  access: accessByProviderOrTenantRole,
  admin: {
    baseListFilter: filterByTenant,
    group: 'Events',
    defaultColumns: ['title', 'subtitle', 'featuredImage', 'startDate', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      admin: {
        description: 'Optional subtitle/tagline for the event',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Short description/summary for event previews',
      },
    },
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
      validate: (value, { siblingData }) => {
        const data = siblingData as { startDate?: string | Date }
        if (value && data?.startDate) {
          const startDate = new Date(data.startDate)
          const endDate = new Date(value)

          if (endDate <= startDate) {
            return 'End date must be after start date.'
          }
        }
        return true
      },
    },
    {
      name: 'timezone',
      type: 'select',
      options: TIMEZONE_OPTIONS,
      admin: {
        description: 'Event timezone',
      },
    },
    locationField(),
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
      validate: (value, { siblingData }) => {
        const data = siblingData as { startDate?: string | Date }
        if (value && data?.startDate) {
          const registrationDeadline = new Date(value)
          const startDate = new Date(data.startDate)

          if (registrationDeadline >= startDate) {
            return 'Registration deadline must be before start date.'
          }
        }
        return true
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
    {
      type: 'group',
      label: 'Landing Page Content',
      admin: {
        description:
          "Create page content for this event's landing page. This landing page will only be displayed if there is not an External Event URL.",
      },
      fields: [
        {
          name: 'content',
          label: '',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => {
              return [
                ...rootFeatures,
                BlocksFeature({
                  blocks: [
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
        },
      ],
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

    // Sidebar
    slugField(),
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: ({ user }) => {
        // Default to external provider course type for provider users/managers
        if (hasProviderAccess(user)) {
          return 'course-by-external-provider'
        }
        return undefined
      },
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ value, siblingData }) => {
            if (typesWithSubTypes.includes(value)) {
              siblingData.eventSubType = undefined
            }
            return value
          },
        ],
      },
      options: eventTypesData.map((eventType) => ({
        label: eventType.label,
        value: eventType.value,
      })),
      filterOptions: ({ req, options }) => {
        // Provider users/managers can only create external provider courses
        if (hasProviderAccess(req.user)) {
          return options.filter((option) => {
            const optionValue = typeof option === 'string' ? option : option.value
            return optionValue === 'course-by-external-provider'
          })
        }
        return options
      },
    },
    {
      name: 'subType',
      type: 'select',
      required: true,
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => typesWithSubTypes.includes(siblingData?.type),
        components: {
          Field: '@/collections/Events/components/SubTypeField#SubTypeField',
        },
      },
      options: eventSubTypesData.map((eventSubType) => ({
        label: eventSubType.label,
        value: eventSubType.value,
      })),
    },
    {
      name: 'eventGroups',
      type: 'relationship',
      relationTo: 'eventGroups',
      hasMany: true,
      admin: {
        position: 'sidebar',
        condition: (_data, _siblingData, { user }) => {
          // Only show to users with tenant role permissions
          return hasTenantRolePermission({
            method: 'read',
            collection: 'events',
            user,
          })
        },
      },
    },
    {
      name: 'eventTags',
      type: 'relationship',
      relationTo: 'eventTags',
      hasMany: true,
      admin: {
        position: 'sidebar',
        condition: (_data, _siblingData, { user }) => {
          // Only show to users with tenant role permissions
          return hasTenantRolePermission({
            method: 'read',
            collection: 'events',
            user,
          })
        },
      },
    },
    {
      name: 'modeOfTravel',
      type: 'select',
      options: [
        { label: 'Ski', value: 'ski' },
        { label: 'Splitboard', value: 'splitboard' },
        { label: 'Motorized', value: 'motorized' },
        { label: 'Snowshoe', value: 'snowshoe' },
        { label: 'Any', value: 'any' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Mode of travel for this event',
      },
    },
    tenantField({
      required: false,
      showInputInDocumentView: true,
      condition: (_data, _siblingData, { user }) => {
        return hasGlobalOrTenantRolePermission({
          method: 'read',
          collection: 'events',
          user,
        })
      },
    }),
    {
      name: 'provider',
      type: 'relationship',
      defaultValue: ({ user }) => {
        // Set provider to their first provider if a provider user
        if (user?.providers && Array.isArray(user.providers)) {
          const providerId =
            typeof user.providers[0] === 'number' ? user.providers[0] : user.providers[0]?.id
          return providerId
        }
        return undefined
      },
      admin: {
        allowCreate: false,
        allowEdit: false,
        position: 'sidebar',
        condition: (_data, _siblingData, { user }) => {
          // Only show provider field to users who have provider access:
          // - Users with provider relationships
          // - Users with global roles that grant provider permissions
          return hasProviderAccess(user)
        },
      },
      hasMany: false,
      index: true,
      relationTo: 'providers',
      filterOptions: ({ user }) => {
        // If user has provider relationships, only show those providers
        if (user?.providers && Array.isArray(user.providers) && user.providers.length > 0) {
          const providerIds = user.providers
            .map((provider) => (typeof provider === 'number' ? provider : provider?.id))
            .filter((id): id is number => typeof id === 'number')

          if (providerIds.length > 0) {
            return {
              id: {
                in: providerIds,
              },
            }
          }
        }

        // Otherwise, show all providers (for users with global roles)
        return true
      },
    },
    contentHashField(),
  ],
  hooks: {
    beforeValidate: [validateEvent],
    beforeChange: [populatePublishedAt, populateBlocksInContent],
    // TODO: need revalidation hooks here
    // TODO: need to update revalidation utilities to look for this blocksInContent field for relationships in addition to Posts and Home Pages
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 10,
  },
}
