import type { CollectionConfig } from 'payload'
import { tenantField } from '@/fields/TenantField'
import { accessByTenant } from '@/access/byTenant'
import { slugField } from '@/fields/slug'

export const NavigationSections: CollectionConfig = {
  slug: 'navigationSections',
  access: accessByTenant('navigationSections'),
  admin: {
    group: 'Navigation',
    useAsTitle: 'title',
  },
  fields: [
    // tenantField,
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
