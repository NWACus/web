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
    },
  ],
  interfaceName: 'BiographyBlock',
  labels: {
    plural: 'Biographies',
    singular: 'Biography',
  },
}
