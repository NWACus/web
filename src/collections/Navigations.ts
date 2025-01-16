import type { CollectionConfig } from 'payload'
import { tenantField, uniqueTenantField } from '@/fields/TenantField'
import { accessByTenant } from '@/access/byTenant'

export const Navigations: CollectionConfig = {
  slug: 'navigations',
  access: accessByTenant('navigations'),
  admin: {
    group: 'Navigation',
  },
  fields: [
    uniqueTenantField,
    {
      name: 'items',
      type: 'relationship',
      hasMany: true,
      required: true,
      relationTo: ['navigationSections', 'pages'],
    },
    {
      name: 'weather_extra',
      type: 'relationship',
      hasMany: false,
      required: false,
      relationTo: ['navigationGroups'],
    },
    {
      name: 'about_us_extra',
      type: 'relationship',
      hasMany: true,
      required: false,
      relationTo: ['pages'],
    },
  ],
}
