import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { BlogListBlock } from '@/blocks/BlogList/config'
import { DocumentBlock } from '@/blocks/Document/config'
import { EventListBlock } from '@/blocks/EventList/config'
import { EventTableBlock } from '@/blocks/EventTable/config'
import { GenericEmbedBlock } from '@/blocks/GenericEmbed/config'
import { HeaderLexicalBlock } from '@/blocks/Header/config'
import { MediaBlock } from '@/blocks/Media/config'
import { SingleBlogPostBlock } from '@/blocks/SingleBlogPost/config'
import { SingleEventBlock } from '@/blocks/SingleEvent/config'
import { SponsorsBlock } from '@/blocks/Sponsors/config'
import { eventTypesData } from '@/constants/eventTypes'
import { contentHashField } from '@/fields/contentHashField'
import { locationField } from '@/fields/location'
import { modeOfTravelField } from '@/fields/modeOfTravelField'
import { skillLevelField } from '@/fields/skillLevel'
import { slugField } from '@/fields/slug'
import { startAndEndDateField } from '@/fields/startAndEndDateField'
import { tenantField } from '@/fields/tenantField'
import { titleField } from '@/fields/title'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { validateEventDates } from '@/hooks/validateEventDates'
import { Course } from '@/payload-types'
import { getImageTypeFilter, getTenantFilter } from '@/utilities/collectionFilters'
import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { MetaImageField } from '@payloadcms/plugin-seo/fields'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { CollectionConfig, DateField, ValidateOptions } from 'payload'
import { date } from 'payload/shared'
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
    titleField(),
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
      validate: validateExternalUrl,
    },
    {
      name: 'externalEventUrl',
      type: 'text',
      admin: {
        description: 'Optional external landing page (takes precedence over event page)',
      },
      validate: validateExternalUrl,
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
          validate: (
            value,
            args: ValidateOptions<unknown, unknown, DateField, Date> & {
              siblingData: Partial<Course>
            },
          ) => {
            const { siblingData: data } = args
            if (value && data?.startDate) {
              const registrationDeadline = new Date(value)
              const startDate = new Date(data.startDate)

              if (registrationDeadline >= startDate) {
                return 'Registration deadline must be before start date.'
              }
            }
            return date(value, args)
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
                    BlogListBlock,
                    DocumentBlock,
                    EventListBlock,
                    EventTableBlock,
                    GenericEmbedBlock,
                    HeaderLexicalBlock,
                    MediaBlock,
                    SingleBlogPostBlock,
                    SingleEventBlock,
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
    drafts: true,
    maxPerDoc: 10,
  },
}
