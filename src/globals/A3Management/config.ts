import { accessByGlobalRole } from '@/access/byGlobalRole'
import type { GlobalConfig } from 'payload'
import { providerManagerRoleFieldAccess } from './access/providerManagerRoleFieldAccess'
import { validateNotificationReceivers } from './hooks/validateNotificationReceivers'

export const A3Management: GlobalConfig = {
  slug: 'a3Management',
  label: 'A3 Management',
  admin: {
    group: 'Settings',
    description:
      'Manage settings for American Avalanche Association (A3) features like external event management.',
  },
  access: accessByGlobalRole('a3Management'),
  hooks: {
    beforeValidate: [validateNotificationReceivers],
  },
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
    },
    {
      name: 'providerManagerRole',
      type: 'relationship',
      relationTo: 'globalRoles',
      access: providerManagerRoleFieldAccess,
    },
  ],
}
