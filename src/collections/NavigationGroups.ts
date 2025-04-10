import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

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
