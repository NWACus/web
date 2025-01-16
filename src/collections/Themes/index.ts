import type { CollectionConfig } from 'payload'
import { accessByGlobalRole } from '@/access/byGlobalRole'
import { colorField } from '@/fields/ColorField'

export const Themes: CollectionConfig = {
  slug: 'themes',
  access: accessByGlobalRole('themes'),
  admin: {
    useAsTitle: 'name',
    group: 'Branding',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'activeColors',
      type: 'group',
      fields: [colorField('light'), colorField('dark')],
    },
    {
      name: 'palettes',
      type: 'group',
      fields: [
        {
          name: 'light',
          type: 'relationship',
          hasMany: false,
          relationTo: 'palettes',
          required: true,
        },
        {
          name: 'dark',
          type: 'relationship',
          hasMany: false,
          relationTo: 'palettes',
          required: true,
        },
      ],
    },
  ],
}
