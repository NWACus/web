import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'
import { revalidateDelete, revalidateTag } from './hooks/revalidateTag'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: accessByTenantRole('tags'),
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
    {
      name: 'posts',
      type: 'join',
      collection: 'posts',
      on: 'tags',
    },
    slugField(),
    contentHashField(),
  ],
  hooks: {
    afterChange: [revalidateTag],
    afterDelete: [revalidateDelete],
  },
}
