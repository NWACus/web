import type { CollectionConfig } from 'payload'

import { byGlobalRole } from '@/access/byGlobalRole'
import { byTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { titleField } from '@/fields/title'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'

export const BuiltInPages: CollectionConfig<'pages'> = {
  slug: 'builtInPages',
  labels: {
    singular: 'Built-In Page',
    plural: 'Built-In Pages',
  },
  access: {
    create: ({ req }) => {
      const tenantSlug = getTenantSlugFromCookie(req.headers)
      return tenantSlug ? byGlobalRole('create', 'builtInPages')({ req }) : false
    },
    read: byTenantRole('read', 'builtInPages'),
    update: byGlobalRole('update', 'builtInPages'),
    delete: ({ req }) => {
      if (!byGlobalRole('delete', 'builtInPages')({ req })) return false
      return { isInNav: { not_equals: true } }
    },
  },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    baseListFilter: filterByTenant,
    defaultColumns: ['title', 'url', 'tenant'],
  },
  fields: [
    titleField(),
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      required: true,
    },
    {
      name: 'isInNav',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        hidden: true,
        description: 'Pages used in navigation cannot be deleted to prevent broken links.',
      },
    },
    tenantField(),
    contentHashField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
  },
}
