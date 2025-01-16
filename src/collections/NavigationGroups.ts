import type { CollectionConfig } from 'payload'
import { tenantField } from '@/fields/TenantField'
import { accessByTenant } from '@/access/byTenant'
import { slugField } from '@/fields/slug'

export const NavigationGroups: CollectionConfig = {
  slug: 'navigationGroups',
  access: accessByTenant('navigationGroups'),
  admin: {
    useAsTitle: 'title',
    group: 'Navigation',
  },
  fields: [
    tenantField,
    ...slugField('title'),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'items',
      type: 'relationship',
      hasMany: true,
      required: true,
      relationTo: ['pages']
    }
  ],
}
