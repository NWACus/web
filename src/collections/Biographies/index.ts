import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { Biography } from '@/payload-types'
import { CollectionConfig, TextField, Validate } from 'payload'
import { revalidateBiography, revalidateDelete } from './hooks/revalidateBiography'

// the types like TextFieldValidation are not parameterized by the collection, so they have `unknown` for siblingData
const validateName: Validate<string, unknown, Biography, TextField> = (name, { siblingData }) => {
  if (siblingData.user && name) {
    return 'A name cannot be provided when a user is linked to this biography.'
  } else if (!siblingData.user && !name) {
    return 'A name must be provided if no user is linked to this biography.'
  } else {
    return true
  }
}

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
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: false,
    },
    {
      name: 'name',
      type: 'text',
      validate: validateName,
      required: false,
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      hasMany: false,
      required: true,
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
    afterDelete: [revalidateDelete],
  },
}
