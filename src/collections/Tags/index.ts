import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: accessByTenant('tags'),
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
    ...slugField(),
    contentHashField(),
  ],
}
