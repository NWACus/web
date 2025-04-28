import type { Block } from 'payload'

export const TeamBlock: Block = {
  slug: 'team',
  fields: [
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      hasMany: false,
      required: true,
    },
  ],
  interfaceName: 'TeamBlock',
  labels: {
    plural: 'Teams',
    singular: 'Team',
  },
}
