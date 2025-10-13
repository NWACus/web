import { accessByTenantRoleWithPermissiveRead } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { Banner } from '@/blocks/Banner/config'
import { BlogListBlockLexical } from '@/blocks/BlogList/config'
import { DocumentBlock } from '@/blocks/DocumentBlock/config'
import { GenericEmbedLexical } from '@/blocks/GenericEmbed/config'
import { HeaderBlock } from '@/blocks/Header/config'
import { MediaBlockLexical } from '@/blocks/MediaBlock/config'
import { SingleBlogPostBlockLexical } from '@/blocks/SingleBlogPost/config'
import { SponsorsBlock } from '@/blocks/SponsorsBlock/config'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
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
  access: accessByTenantRoleWithPermissiveRead('events'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Content',
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
    },
    {
      name: 'timezone',
      type: 'select',
      options: TIMEZONE_OPTIONS,
      admin: {
        description: 'Event timezone',
      },
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        {
          name: 'isVirtual',
          type: 'checkbox',
          admin: {
            description: 'Check if this is an online/virtual event',
          },
        },
        {
          name: 'virtualUrl',
          type: 'text',
          admin: {
            condition: (_data, siblingData) => siblingData?.isVirtual,
            description: 'Meeting link for virtual events',
          },
        },
        {
          name: 'venue',
          type: 'text',
          admin: {
            description: 'Venue name',
            condition: (data, siblingData) => !siblingData?.isVirtual,
          },
        },
        {
          name: 'address',
          type: 'text',
          admin: {
            description: 'Street address',
            condition: (data, siblingData) => !siblingData?.isVirtual,
          },
        },
        {
          name: 'city',
          type: 'text',
          admin: {
            description: 'City',
            condition: (data, siblingData) => !siblingData?.isVirtual,
          },
        },
        {
          name: 'state',
          type: 'text',
          admin: {
            description: 'State',
            condition: (data, siblingData) => !siblingData?.isVirtual,
          },
        },
        {
          name: 'zip',
          type: 'text',
          admin: {
            description: 'ZIP code',
            condition: (data, siblingData) => !siblingData?.isVirtual,
          },
        },
        {
          name: 'extraInfo',
          type: 'text',
          admin: {
            description: 'Extra location info (e.g., "Meet in lot 4")',
          },
        },
      ],
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
                    GenericEmbedLexical,
                    HeaderBlock,
                    MediaBlockLexical,
                    SingleBlogPostBlockLexical,
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
      name: 'eventType',
      type: 'relationship',
      relationTo: 'eventTypes',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'eventSubType',
      type: 'relationship',
      relationTo: 'eventSubTypes',
      filterOptions: ({ data }) => {
        // Only show subtypes for the selected type
        if (data?.eventType) {
          return {
            eventType: { equals: data.eventType },
          }
        }
        return false
      },
      admin: {
        condition: (_data, siblingData) => siblingData?.eventType,
        position: 'sidebar',
        description: 'Optional event sub type',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      admin: {
        allowCreate: false,
        allowEdit: false,
        position: 'sidebar',
        // TODO: need a slightly different TenantFieldComponent with custom logic for optional tenant fields like this (maybe abstract this optional tenant field into it's own field fn)
        // should set to the current tenant if the admin panel is tenant-scoped (i.e. the user has only one tenant), should be selectable if the user has access to multiple tenants
        // components: {
        //   Field: {
        //     clientProps: {
        //       debug: false,
        //       unique: false,
        //     },
        //     path: '@/fields/tenantField/TenantFieldComponent#TenantFieldComponent',
        //   },
        // },
      },
      maxDepth: 3,
      index: true,
      label: 'Avalanche Center',
      relationTo: 'tenants',
    },
    contentHashField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt, populateBlocksInContent],
    // TODO: need revalidation hooks here
    // TODO: need to update revalidation utilities to look for this blocksInContent field for relationships in addition to Posts and Home Pages
  },
}
