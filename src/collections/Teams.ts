import { accessByTenantWithPermissiveRead } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

export const Teams: CollectionConfig = {
  slug: 'teams',
  access: accessByTenantWithPermissiveRead('teams'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Staff',
    useAsTitle: 'name',
  },
  fields: [
    tenantField(),
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'biographies',
      hasMany: true,
      required: true,
    },
    contentHashField(),
  ],
}
