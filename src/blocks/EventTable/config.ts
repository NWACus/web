import { eventTypesData } from '@/collections/Events/constants'
import { getTenantFilter } from '@/utilities/collectionFilters'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Block, Field, FilterOptionsProps } from 'payload'
import { ButtonBlock } from '../Button/config'
import { GenericEmbedLexical } from '../GenericEmbed/config'
import { MediaBlockLexical } from '../MediaBlock/config'
import { validateMaxEvents } from './hooks/validateMaxEvents'

const defaultStylingFields: Field[] = [
  { name: 'heading', type: 'text' },
  {
    name: 'belowHeadingContent',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          BlocksFeature({
            blocks: [ButtonBlock, MediaBlockLexical, GenericEmbedLexical],
          }),
          HorizontalRuleFeature(),
          InlineToolbarFeature(),
        ]
      },
    }),
    label: 'Content Below Heading',
    admin: {
      description: 'Optional content to display below the heading and above the event table.',
    },
  },
  {
    type: 'radio',
    name: 'eventOptions',
    label: 'How do you want to choose your events?',
    defaultValue: 'dynamic',
    required: true,
    options: [
      {
        label: 'Do it for me',
        value: 'dynamic',
      },
      {
        label: 'Let me choose',
        value: 'static',
      },
    ],
  },
]

const dynamicEventRelatedFields: Field[] = [
  {
    name: 'dynamicOptions',
    type: 'group',
    admin: {
      condition: (_, siblingData) => siblingData?.eventOptions === 'dynamic',
    },
    fields: [
      {
        name: 'filterByEventTypes',
        type: 'select',
        dbName: 'filterByEventTypes',
        options: eventTypesData.map((type) => ({
          label: type.label,
          value: type.value,
        })),
        hasMany: true,
        label: 'Filter by Event Type(s)',
        admin: {
          description: 'Optionally select event types to filter events.',
        },
      },
      {
        name: 'maxEvents',
        type: 'number',
        label: 'Max Events Displayed',
        min: 1,
        max: 20,
        defaultValue: 4,
        admin: {
          description: 'Maximum number of events that will be displayed. Must be an integer.',
          step: 1,
        },
        hooks: {
          beforeValidate: [validateMaxEvents],
        },
      },
      {
        name: 'queriedEvents',
        type: 'relationship',
        label: 'Preview Events Order',
        relationTo: 'events',
        hasMany: true,
        admin: {
          readOnly: true,
          components: {
            Field: '@/blocks/EventTable/fields/QueriedEventsComponent#QueriedEventsComponent',
          },
        },
      },
    ],
  },
]

const staticEventRelatedFields: Field[] = [
  {
    name: 'staticOptions',
    type: 'group',
    admin: {
      condition: (_, siblingData) => siblingData?.eventOptions === 'static',
    },
    fields: [
      {
        name: 'staticEvents',
        type: 'relationship',
        label: 'Choose events',
        relationTo: 'events',
        hasMany: true,
        admin: {
          description: 'Choose new event from dropdown and/or drag and drop to change order',
        },
        filterOptions: (props: FilterOptionsProps) => ({
          and: [getTenantFilter(props)],
        }),
      },
    ],
  },
]

export const EventTableBlock: Block = {
  slug: 'eventTable',
  interfaceName: 'EventTableBlock',
  imageURL: '/thumbnail/EventTableThumbnail.jpg',
  fields: [...defaultStylingFields, ...dynamicEventRelatedFields, ...staticEventRelatedFields],
}
