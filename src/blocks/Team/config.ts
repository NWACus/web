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
      filterOptions: ({ data }) => {
        return {
          tenant: {
            equals: data.tenant,
          },
        }
      },
    },
  ],
  interfaceName: 'TeamBlock',
  labels: {
    plural: 'Teams',
    singular: 'Team',
  },
  imageURL: '/thumbnail/TeamThumbnail.jpg',
}
