import { accessByGlobalRole } from '@/access/byGlobalRole'
import type { GlobalConfig } from 'payload'
import { providerManagerRoleFieldAccess } from './access/providerManagerRoleFieldAccess'

export const A3Management: GlobalConfig = {
  slug: 'a3Management',
  label: 'A3 Management',
  admin: {
    group: 'Settings',
    description:
      'Manage settings for American Avalanche Association (A3) features like external event management.',
  },
  access: accessByGlobalRole('a3Management'),
  fields: [
    {
      name: 'providerManagerRole',
      type: 'relationship',
      relationTo: 'globalRoles',
      access: providerManagerRoleFieldAccess,
    },
  ],
}
