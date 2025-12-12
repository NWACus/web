import { accessByGlobalRoleReadOnly } from '@/access/byGlobalRole'
import type { GlobalConfig } from 'payload'

export const DiagnosticsConfig: GlobalConfig = {
  slug: 'diagnostics',
  label: 'Diagnostics',
  admin: {
    group: 'Settings',
    description: 'Displays diagnostic data about the current environment.',
  },
  access: accessByGlobalRoleReadOnly('diagnostics'),
  fields: [
    {
      type: 'ui',
      name: 'diagnosticsDisplay',
      admin: {
        components: {
          Field: '@/globals/Diagnostics/components/DiagnosticsDisplay#DiagnosticsDisplay',
        },
        disableListColumn: true,
      },
    },
    {
      type: 'ui',
      name: 'revalidateCache',
      admin: {
        components: {
          Field: '@/globals/Diagnostics/components/RevalidateCacheField#RevalidateCacheField',
        },
        disableListColumn: true,
      },
    },
  ],
}
