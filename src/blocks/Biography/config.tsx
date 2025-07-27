import type { Block } from 'payload'

export const BiographyBlock: Block = {
  slug: 'biography',
  fields: [
    {
      name: 'biography',
      type: 'relationship',
      relationTo: 'biographies',
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
  interfaceName: 'BiographyBlock',
  labels: {
    plural: 'Biographies',
    singular: 'Biography',
  },
  imageURL: '/thumbnail/BiographyThumbnail.jpg',
}
