import { eventSubTypesData, eventTypesData } from '@/collections/Events/constants'
import colorPickerField from '@/fields/color'
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
      description: 'Optional content to display below the heading and above the event list.',
    },
  },
  colorPickerField('Background color'),
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
        name: 'sortBy',
        type: 'select',
        defaultValue: 'startDate',
        options: [
          { label: 'Start Date (Earliest First)', value: 'startDate' },
          { label: 'Start Date (Latest First)', value: '-startDate' },
          { label: 'Registration Deadline (Earliest First)', value: 'registrationDeadline' },
          { label: 'Registration Deadline (Latest First)', value: '-registrationDeadline' },
        ],
        required: true,
        admin: {
          description: 'Select how the list of events will be sorted.',
        },
      },
      {
        name: 'filterByEventTypes',
        type: 'select',
        dbName: 'filterByEventTypes',
        options: eventTypesData.map((eventType) => ({
          label: eventType.label,
          value: eventType.value,
        })),
        hasMany: true,
        label: 'Filter by Event Type(s)',
        admin: {
          description: 'Optionally select event types to filter events in this list by.',
        },
      },
      {
        name: 'filterByEventSubTypes',
        type: 'select',
        dbName: 'filterByEventSubTypes',
        options: eventSubTypesData.map((eventType) => ({
          label: eventType.label,
          value: eventType.value,
        })),
        hasMany: true,
        label: 'Filter by Event Sub Type(s)',
        admin: {
          description: 'Optionally select event sub types to filter events in this list by.',
        },
      },
      {
        name: 'showUpcomingOnly',
        type: 'checkbox',
        defaultValue: true,
        label: 'Show Upcoming Events Only',
        admin: {
          description: 'Only display events that have not yet occurred.',
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
            Field: '@/blocks/EventList/fields/QueriedEventsComponent#QueriedEventsComponent',
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

const eventListBlockWithFields = (fields: Field[]): Block => ({
  slug: 'eventList',
  interfaceName: 'EventListBlock',
  imageURL: '/thumbnail/EventListThumbnail.jpg',
  fields,
})

export const EventListBlock = eventListBlockWithFields([
  ...defaultStylingFields,
  ...dynamicEventRelatedFields,
  ...staticEventRelatedFields,
])

export const EventListBlockLexical = eventListBlockWithFields([
  ...defaultStylingFields,
  {
    name: 'wrapInContainer',
    admin: {
      description:
        'Checking this will render the block with additional padding around it and using the background color you have selected.',
    },
    type: 'checkbox',
    defaultValue: false,
  },
  ...dynamicEventRelatedFields,
  ...staticEventRelatedFields,
])
