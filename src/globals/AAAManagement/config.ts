import { accessByGlobalRole } from '@/access/byGlobalRole'
import type { GlobalConfig } from 'payload'

export const AAAManagement: GlobalConfig = {
  slug: 'aaaManagement',
  label: 'AAA Management',
  admin: {
    group: 'Settings',
    description:
      'Manage settings for American Avalanche Association features like external event management.',
  },
  access: accessByGlobalRole('aaaManagement'),
  fields: [
    {
      name: 'notificationReceivers',
      label: 'Receive Notifications of New Provider Applications',
      type: 'relationship',
      hasMany: true,
      relationTo: 'users',
      admin: {
        description:
          'These users will receive notifications when new provider applications are submitted.',
      },
      // TODO: add a hook that validates that these manager users have provider * permission (not a specific role though because the name could be anything in different environments)
    },
    {
      name: 'providerManagerRole',
      type: 'relationship',
      relationTo: 'globalRoles',
    },
  ],
}
