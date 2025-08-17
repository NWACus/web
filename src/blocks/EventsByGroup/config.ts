import type { Block } from 'payload'

export const EventsByGroup: Block = {
  slug: 'events-by-group',
  labels: {
    singular: 'Events by Group',
    plural: 'Events by Group',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Optional title for this section',
      },
    },
    {
      name: 'eventGroups',
      type: 'relationship',
      relationTo: 'event-groups',
      hasMany: true,
      required: true,
      admin: {
        description: 'Select event groups to display events from',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 12,
      admin: {
        description: 'Number of events to display',
      },
    },
    {
      name: 'showFutureOnly',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Only show future events',
      },
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'List', value: 'list' },
      ],
      admin: {
        description: 'How to display the events',
      },
    },
  ],
}
