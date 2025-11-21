import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { Banner } from '@/blocks/Banner/config'
import { BlogListBlockLexical } from '@/blocks/BlogList/config'
import { DocumentBlock } from '@/blocks/DocumentBlock/config'
import { EventListBlockLexical } from '@/blocks/EventList/config'
import { EventTableBlock } from '@/blocks/EventTable/config'
import { GenericEmbedLexical } from '@/blocks/GenericEmbed/config'
import { HeaderBlock } from '@/blocks/Header/config'
import { MediaBlockLexical } from '@/blocks/MediaBlock/config'
import { SingleBlogPostBlockLexical } from '@/blocks/SingleBlogPost/config'
import { SingleEventBlockLexical } from '@/blocks/SingleEvent/config'
import { SponsorsBlock } from '@/blocks/SponsorsBlock/config'
import { eventTypesData } from '@/constants/eventTypes'
import { contentHashField } from '@/fields/contentHashField'
import { locationField } from '@/fields/location'
import { modeOfTravelField } from '@/fields/modeOfTravelField'
import { slugField } from '@/fields/slug'
import { startAndEndDateField } from '@/fields/startAndEndDateField'
import { tenantField } from '@/fields/tenantField'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { getImageTypeFilter, getTenantFilter } from '@/utilities/collectionFilters'
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

export const Events: CollectionConfig = {
  slug: 'events',
  access: accessByTenantRole('events'),
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
    startAndEndDateField(),
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
      name: 'thumbnailImage',
      type: 'upload',
      relationTo: 'media',
      filterOptions: getImageTypeFilter,
    },
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
      type: 'row',
      fields: [
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
      ],
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
                    EventTableBlock,
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
      ],
    },

    // Sidebar
    slugField(),
    {
      name: 'type',
      type: 'select',
      required: true,
      admin: {
        position: 'sidebar',
      },
      options: eventTypesData.map((eventType) => ({
        label: eventType.label,
        value: eventType.value,
      })),
    },
    {
      name: 'eventGroups',
      type: 'relationship',
      relationTo: 'eventGroups',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
      filterOptions: getTenantFilter,
    },
    {
      name: 'eventTags',
      type: 'relationship',
      relationTo: 'eventTags',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
      filterOptions: getTenantFilter,
    },
    modeOfTravelField(),
    tenantField(),
    contentHashField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt, populateBlocksInContent],
    // TODO: need revalidation hooks herehooks: {
    // TODO: need to update revalidation utilities to look for this blocksInContent field for relationships in addition to Posts and Home Pages
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 10,
  },
}
