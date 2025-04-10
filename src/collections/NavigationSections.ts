import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

export const NavigationSections: CollectionConfig = {
  slug: 'navigationSections',
  access: accessByTenant('navigationSections'),
  admin: {
    group: 'Navigation',
    useAsTitle: 'title',
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
      relationTo: ['navigationGroups', 'pages'],
      // TODO: enforce either all groups or all pages, not mixed on validation
    },
  ],
}
