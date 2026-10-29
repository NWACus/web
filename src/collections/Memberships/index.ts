import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

/** A Member's relationship with one center; the privacy boundary for tenant admins (ADR 026). */
export const Memberships: CollectionConfig = {
  slug: 'memberships',
  access: accessByTenantRole('memberships'),
  admin: {
    group: 'Members',
    defaultColumns: ['member', 'tenant', 'kind', 'createdAt'],
    baseListFilter: filterByTenant,
  },
  fields: [
    { name: 'member', type: 'relationship', relationTo: 'members', required: true, index: true },
    tenantField(),
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'site',
      options: [
        { label: 'Donor', value: 'donor' },
        { label: 'Paid membership', value: 'paid' },
        { label: 'Site customization', value: 'site' },
      ],
    },
  ],
}
