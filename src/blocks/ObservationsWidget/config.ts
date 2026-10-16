import type { Block } from 'payload'
import { DEFAULT_DATE_RANGE, isValidDateRange } from './widgetPath'

export const DEFAULT_OBSERVATIONS_HEADING = 'Recent Observations'

export const ObservationsWidgetBlock: Block = {
  slug: 'observationsWidget',
  interfaceName: 'ObservationsWidgetBlock',
  labels: {
    singular: 'Observations Widget',
    plural: 'Observations Widgets',
  },
  fields: [
    {
      name: 'showHeader',
      type: 'checkbox',
      label: 'Show heading and Submit Observation button',
      defaultValue: true,
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: DEFAULT_OBSERVATIONS_HEADING,
      admin: {
        condition: (_, siblingData) => siblingData?.showHeader !== false,
      },
    },
    {
      type: 'collapsible',
      label: 'Starting filters',
      admin: {
        description: 'What the widget shows first. Visitors can change or clear these filters.',
      },
      fields: [
        {
          name: 'tab',
          type: 'radio',
          label: 'Open on',
          options: [
            { label: 'Observations', value: 'observations' },
            { label: 'Avalanches', value: 'avalanches' },
          ],
          defaultValue: 'observations',
          admin: { layout: 'horizontal' },
        },
        {
          name: 'avalanchesObservedOnly',
          type: 'checkbox',
          label: 'Only observations that report avalanches',
          admin: {
            condition: (_, siblingData) => siblingData?.tab !== 'avalanches',
          },
        },
        {
          name: 'dateRange',
          type: 'text',
          defaultValue: DEFAULT_DATE_RANGE,
          required: true,
          validate: (value: string | null | undefined) =>
            (typeof value === 'string' && isValidDateRange(value, new Date())) ||
            'Pick a date range from the list.',
          admin: {
            description:
              'Ranges count back from the day someone views the page; a past season always shows that whole season. Links and bookmarks keep the dates from the day they were copied or saved.',
            components: {
              Field: '@/blocks/ObservationsWidget/DateRangeField#DateRangeField',
            },
          },
        },
        {
          name: 'zones',
          type: 'text',
          hasMany: true,
          // Zone names belong to one center, so a page copied to another center drops them
          custom: { tenantScoped: true },
          admin: {
            description: 'Leave empty to show every zone.',
            components: {
              Field: '@/blocks/ObservationsWidget/ZonesField#ZonesField',
            },
          },
        },
      ],
    },
  ],
}
