import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

export const Teams: CollectionConfig = {
  slug: 'teams',
  access: accessByTenant('teams'),
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
  ],
}
