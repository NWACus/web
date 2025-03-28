import type { CollectionConfig } from 'payload'
import { tenantField } from '@/fields/TenantField'
import { accessByTenant } from '@/access/byTenant'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: accessByTenant('categories'),
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  fields: [
    // tenantField,
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
