import type { CollectionConfig } from 'payload'
import { accessByTenant } from '@/access/byTenant'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { filterByTenant } from '@/access/filterByTenant'

export const NavigationGroups: CollectionConfig = {
  slug: 'navigationGroups',
  access: accessByTenant('navigationGroups'),
  admin: {
    useAsTitle: 'title',
    group: 'Navigation',
    baseListFilter: filterByTenant,
  },
  fields: [
    tenantField(),
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
      relationTo: ['pages'],
    },
  ],
}
