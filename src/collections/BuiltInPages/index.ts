import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities'
import type { CollectionConfig } from 'payload'

import { accessByGlobalRoleWithAuthenticatedRead, byGlobalRole } from '@/access/byGlobalRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'

export const BuiltInPages: CollectionConfig<'pages'> = {
  slug: 'builtInPages',
  labels: {
    singular: 'Built-In Page',
    plural: 'Built-In Pages',
  },
  access: {
    ...accessByGlobalRoleWithAuthenticatedRead('builtInPages'),
    create: ({ req }) => {
      const tenantFromCookie = getTenantFromCookie(req.headers, 'number')
      return tenantFromCookie ? byGlobalRole('create', 'builtInPages')({ req }) : false
    },
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
