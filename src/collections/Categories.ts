import type { CollectionConfig } from 'payload'
import { accessByTenant } from '@/access/byTenant'
import { tenantField } from '@/fields/tenantField'
import { filterByTenant } from '@/access/filterByTenant'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: accessByTenant('categories'),
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    baseListFilter: filterByTenant,
  },
  fields: [
    tenantField(),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
