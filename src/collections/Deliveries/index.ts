import { accessByGlobalRole } from '@/access/byGlobalRole'
import type { CollectionConfig } from 'payload'

/** One notification sent to one Device for one Subscription. */
export const Deliveries: CollectionConfig = {
  slug: 'deliveries',
  access: accessByGlobalRole('deliveries'),
  admin: {
    useAsTitle: 'title',
    group: 'Members',
    defaultColumns: ['title', 'member', 'device', 'sentAt'],
  },
  fields: [
    { name: 'member', type: 'relationship', relationTo: 'members', required: true, index: true },
    { name: 'device', type: 'relationship', relationTo: 'devices' },
    { name: 'subscription', type: 'relationship', relationTo: 'subscriptions' },
    { name: 'title', type: 'text', required: true },
    { name: 'sentAt', type: 'date' },
  ],
}
