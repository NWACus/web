import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

export const SUBSCRIPTION_CATEGORIES = ['forecast', 'warning', 'observation'] as const
export const SUBSCRIPTION_CHANNELS = ['push', 'email'] as const

/** A Member's opt-in to one center × zone × category × channel. Independent of Membership. */
export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  access: accessByTenantRole('subscriptions'),
  admin: {
    group: 'Members',
    defaultColumns: ['member', 'tenant', 'zone', 'category', 'channel'],
    baseListFilter: filterByTenant,
  },
  fields: [
    { name: 'member', type: 'relationship', relationTo: 'members', required: true, index: true },
    tenantField(),
    { name: 'zone', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: SUBSCRIPTION_CATEGORIES.map((value) => ({ label: value, value })),
    },
    {
      name: 'channel',
      type: 'select',
      required: true,
      options: SUBSCRIPTION_CHANNELS.map((value) => ({ label: value, value })),
    },
  ],
}
