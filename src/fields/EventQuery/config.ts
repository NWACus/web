import type { Field, FilterOptionsProps } from 'payload'

import { ButtonBlock } from '@/blocks/Button/config'
import { GenericEmbedLexical } from '@/blocks/GenericEmbed/config'
import { MediaBlockLexical } from '@/blocks/MediaBlock/config'
import { eventTypesData } from '@/constants/eventTypes'
import { getTenantFilter } from '@/utilities/collectionFilters'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { validateMaxEvents } from './hooks/validateMaxEvents'

export const defaultStylingFields = (additionalFilters?: Field[]): Field[] => [
  ...(additionalFilters ?? []),
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
      description: 'Optional content to display below the heading and above the event content.',
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

export const dynamicEventRelatedFields = (additionalFilters?: Field[]): Field[] => [
  {
    name: 'dynamicOptions',
    type: 'group',
    admin: {
      condition: (_, siblingData) => siblingData?.eventOptions === 'dynamic',
      description: 'Use Preview ↗ to see how events will appear',
    },
    fields: [
      ...(additionalFilters ?? []),
      {
        name: 'filterByEventTypes',
        type: 'select',
        dbName: 'filterByEventTypes',
        options: eventTypesData.map((type, index) => ({
          key: `${type.value}-${index}`,
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
        name: 'filterByEventGroups',
        type: 'relationship',
        relationTo: 'eventGroups',
        hasMany: true,
        admin: {
          position: 'sidebar',
          description: 'Optionally select event group to filter events.',
        },
        filterOptions: getTenantFilter,
      },
      {
        name: 'filterByEventTags',
        type: 'relationship',
        relationTo: 'eventTags',
        hasMany: true,
        admin: {
          position: 'sidebar',
          description: 'Optionally select event tags to filter events.',
        },
        filterOptions: getTenantFilter,
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
    ],
  },
]

export const staticEventRelatedFields: Field[] = [
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
