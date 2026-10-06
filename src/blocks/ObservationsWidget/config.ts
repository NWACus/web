import type { Block } from 'payload'
import { DATE_RANGES, DEFAULT_DATE_RANGE } from './widgetPath'

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
          type: 'select',
          options: DATE_RANGES.map(({ value, label }) => ({ value, label })),
          defaultValue: DEFAULT_DATE_RANGE,
          required: true,
          admin: {
            description: 'Counted back from the day someone views the page.',
          },
        },
        {
          name: 'zones',
          type: 'text',
          hasMany: true,
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
