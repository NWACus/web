import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

// A paid center membership counts as donating; it is not a third kind.
export const MEMBERSHIP_KINDS = {
  free: 'Free (has an account with this center)',
  donor: 'Donor',
} as const

/**
 * A Member's relationship with one center; the privacy boundary for tenant admins (ADR 026).
 * Most are `free`, created the first time a center host hands the Member a site session;
 * `donor` comes later from donation and paid-membership flows.
 */
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
      defaultValue: 'free',
      options: Object.entries(MEMBERSHIP_KINDS).map(([value, label]) => ({ label, value })),
    },
    {
      name: 'preferences',
      type: 'json',
      admin: { description: 'Preferences scoped to this center. Global ones live on the Member.' },
    },
  ],
}
