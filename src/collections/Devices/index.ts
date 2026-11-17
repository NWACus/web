import { accessByGlobalRole } from '@/access/byGlobalRole'
import type { CollectionConfig } from 'payload'

/** An AvyApp install that can receive notifications. Belongs to at most one Member at a time. */
export const Devices: CollectionConfig = {
  slug: 'devices',
  access: accessByGlobalRole('devices'),
  admin: {
    useAsTitle: 'installId',
    group: 'Members',
    defaultColumns: ['installId', 'platform', 'member', 'updatedAt'],
  },
  fields: [
    { name: 'installId', type: 'text', required: true, unique: true, index: true },
    // SHA-256 of the device secret; the secret itself lives only in the app's SecureStore.
    { name: 'secretHash', type: 'text', admin: { hidden: true } },
    { name: 'pushToken', type: 'text' },
    {
      name: 'platform',
      type: 'select',
      options: [
        { label: 'iOS', value: 'ios' },
        { label: 'Android', value: 'android' },
      ],
    },
    { name: 'member', type: 'relationship', relationTo: 'members', index: true },
  ],
}
