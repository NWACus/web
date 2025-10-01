import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { linkToPageOrPost } from '@/fields/linkToPageOrPost'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'
import { revalidateRedirect, revalidateRedirectDelete } from './hooks/revalidateRedirect'
import { validateFrom } from './hooks/validateFrom'

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  access: accessByTenantRole('redirects'),
  labels: {
    singular: 'Redirect',
    plural: 'Redirects',
  },
  admin: {
    baseListFilter: filterByTenant,
    group: 'Settings',
    useAsTitle: 'from',
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      index: true,
      required: true,
      label: 'From URL',
      admin: {
        description: 'Relative url like /old-path',
      },
      hooks: {
        beforeChange: [validateFrom],
      },
    },
    {
      name: 'to',
      type: 'group',
      admin: {
        hideGutter: true,
      },
      fields: [...linkToPageOrPost],
    },
    tenantField(),
    contentHashField(),
  ],
  hooks: {
    afterChange: [revalidateRedirect],
    afterDelete: [revalidateRedirectDelete],
  },
}
