import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { getImageTypeFilter } from '@/utilities/collectionFilters'
import { CollectionConfig } from 'payload'

import { MetaImageField } from '@payloadcms/plugin-seo/fields'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { Banner } from '@/blocks/Banner/config'
import { BlogListBlockLexical } from '@/blocks/BlogList/config'
import { ButtonBlock } from '@/blocks/Button/config'
import { CalloutBlock } from '@/blocks/Callout/config'
import { DocumentBlock } from '@/blocks/DocumentBlock/config'
import { EventListBlockLexical } from '@/blocks/EventList/config'
import { EventTableBlock } from '@/blocks/EventTable/config'
import { GenericEmbedLexical } from '@/blocks/GenericEmbed/config'
import { HeaderBlock } from '@/blocks/Header/config'
import { MediaBlockLexical } from '@/blocks/MediaBlock/config'
import { SingleBlogPostBlockLexical } from '@/blocks/SingleBlogPost/config'
import { SingleEventBlockLexical } from '@/blocks/SingleEvent/config'
import { SponsorsBlock } from '@/blocks/SponsorsBlock/config'

export const EventGroups: CollectionConfig = {
  slug: 'eventGroups',
  access: accessByTenantRole('eventGroups'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Events',
    useAsTitle: 'title',
  },
  fields: [
    tenantField(),
    {
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
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
                    ButtonBlock,
                    CalloutBlock,
                    DocumentBlock,
                    EventListBlockLexical,
                    EventTableBlock,
                    SingleEventBlockLexical,
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
    slugField(),
    MetaImageField({
      hasGenerateFn: true,
      relationTo: 'media',
      overrides: {
        admin: {
          allowCreate: true,
          position: 'sidebar',
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
      admin: {
        position: 'sidebar',
      },
    },
    contentHashField(),
  ],
}
