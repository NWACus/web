import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { CollectionConfig } from 'payload'
import { revalidateTeam, revalidateTeamDelete } from './hooks/revalidateTeam'

export const Teams: CollectionConfig = {
  slug: 'teams',
  access: accessByTenantRole('teams'),
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
      admin: {
        description:
          'This will display anywhere you add the Team block (ie. on the Who We Are page).',
      },
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'biographies',
      hasMany: true,
      required: true,
      filterOptions: getTenantFilter,
      admin: {
        description:
          'Add members to the team and drag/drop to reorder how they display on the page.',
      },
    },
    contentHashField(),
  ],
  hooks: {
    afterChange: [revalidateTeam],
    afterDelete: [revalidateTeamDelete],
  },
}
