import type { CollectionConfig } from 'payload'

import { byGlobalRole } from '@/access/byGlobalRole'
import { byTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { getTenantFromCookie } from '@/utilities/tenancy/getTenantFromCookie'

export const BuiltInPages: CollectionConfig<'pages'> = {
  slug: 'builtInPages',
  labels: {
    singular: 'Built-In Page',
    plural: 'Built-In Pages',
  },
  access: {
    create: ({ req }) => {
      const tenantFromCookie = getTenantFromCookie(req.headers, 'number')
      return tenantFromCookie ? byGlobalRole('create', 'builtInPages')({ req }) : false
    },
    read: byTenantRole('read', 'builtInPages'),
    update: byGlobalRole('update', 'builtInPages'),
    delete: byGlobalRole('delete', 'builtInPages'),
  },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    baseListFilter: filterByTenant,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      required: true,
    },
    tenantField(),
    contentHashField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
  },
}
