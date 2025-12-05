import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { Banner } from '@/blocks/Banner/config'
import { BlogListBlockLexical } from '@/blocks/BlogList/config'
import { DocumentBlock } from '@/blocks/DocumentBlock/config'
import { EventListBlockLexical } from '@/blocks/EventList/config'
import { EventTableBlockLexical } from '@/blocks/EventTable/config'
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
import { skillLevelField } from '@/fields/skillLevel'
import { slugField } from '@/fields/slug'
import { startAndEndDateField } from '@/fields/startAndEndDateField'
import { tenantField } from '@/fields/tenantField'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { validateEventDates } from '@/hooks/validateEventDates'
import { Event } from '@/payload-types'
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
import { revalidateEvent, revalidateEventDelete } from './hooks/revalidateEvent'

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
          timezone: {
            supportedTimezones: TIMEZONE_OPTIONS,
          },
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            description:
              'Registration cutoff. Timezone will always be set to the startDate timezone.',
          },
          validate: (value, { siblingData }: { siblingData: Partial<Event> }) => {
            const data = siblingData
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
      ],
    },
    skillLevelField(),
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
                    EventTableBlockLexical,
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
    beforeValidate: [validateEventDates],
    beforeChange: [populatePublishedAt, populateBlocksInContent],
    afterChange: [revalidateEvent],
    afterDelete: [revalidateEventDelete],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 10,
  },
}
