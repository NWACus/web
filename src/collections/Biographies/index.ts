import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'
import { revalidateBiography, revalidateBiographyDelete } from './hooks/revalidateBiography'

export const Biographies: CollectionConfig = {
  slug: 'biographies',
  access: accessByTenantRole('biographies'),
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
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      hasMany: false,
      required: true,
      admin: {
        description:
          'We recommend using a headshot. Photos currently show up where the biography/author is displayed (like blog posts).',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: false,
    },
    {
      name: 'start_date',
      type: 'date',
      label: 'Start Date',
      required: false,
      admin: {
        description:
          'Optional. We recommend either using them for everyone (on a specific team) or not at all.',
      },
    },
    {
      name: 'biography',
      type: 'textarea',
      required: false,
    },
    contentHashField(),
  ],
  hooks: {
    afterChange: [revalidateBiography],
    afterDelete: [revalidateBiographyDelete],
  },
}
