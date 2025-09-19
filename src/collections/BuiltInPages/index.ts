import { accessByGlobalRole } from '@/access/byGlobalRole'
import type { CollectionConfig } from 'payload'

import { populatePublishedAt } from '@/hooks/populatePublishedAt'

import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'

export const BuiltInPages: CollectionConfig<'pages'> = {
  slug: 'builtInPages',

  labels: {
    singular: 'Built-In Page',
    plural: 'Built-In Pages',
  },
  access: accessByGlobalRole('builtInPages'),
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'url', 'updatedAt'],
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
