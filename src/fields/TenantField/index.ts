import type { Field } from 'payload'

import { autofillTenant } from './hooks/autofillTenant'
import { mutateTenantField } from '@/fields/TenantField/access/mutateTenantField'

export const tenantField: Field = {
  name: 'tenant',
  type: 'relationship',
  access: {
    read: () => true,
    create: () => true,
    // TODO: create for all doesn't grey this out if there's only one option, which is not ideal
    update: mutateTenantField,
  },
  admin: {
    components: {
      Field: '@/fields/TenantField/components/Field#TenantFieldComponent',
    },
  },
  hasMany: false,
  hooks: {
    beforeValidate: [autofillTenant],
  },
  index: true,
  relationTo: 'tenants',
  required: true,
}
