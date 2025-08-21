import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  access: accessByTenantRole('sponsors'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Content',
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
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      // add validation
      name: 'link',
      type: 'text',
      required: true,
    },
    {
      name: 'start_date',
      type: 'date',
      label: 'Start Date',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'end_date',
      type: 'date',
      label: 'End Date',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    contentHashField(),
  ],
  hooks: {
    afterChange: [],
    afterDelete: [],
  },
}
