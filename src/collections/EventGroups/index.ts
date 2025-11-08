import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { DocumentBlock } from '@/blocks/DocumentBlock/config'
import { EventListBlockLexical } from '@/blocks/EventList/config'
import { GenericEmbedLexical } from '@/blocks/GenericEmbed/config'
import { HeaderBlock } from '@/blocks/Header/config'
import { MediaBlockLexical } from '@/blocks/MediaBlock/config'
import { SingleEventBlockLexical } from '@/blocks/SingleEvent/config'
import { SponsorsBlock } from '@/blocks/SponsorsBlock/config'

import { ButtonBlock } from '@/blocks/Button/config'
import { CalloutBlock } from '@/blocks/Callout/config'
import { EventTableBlock } from '@/blocks/EventTable/config'

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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            BlocksFeature({
              blocks: [
                ButtonBlock,
                CalloutBlock,
                DocumentBlock,
                EventListBlockLexical,
                EventTableBlock,
                SingleEventBlockLexical,
                GenericEmbedLexical,
                HeaderBlock,
                MediaBlockLexical,
                SponsorsBlock,
              ],
            }),
            HorizontalRuleFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
    },
    slugField(),
    contentHashField(),
  ],
}
