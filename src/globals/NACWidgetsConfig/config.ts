import { accessByGlobalRole } from '@/access/byGlobalRole'
import { validateExternalUrl } from '@/utilities/validateUrl'
import type { GlobalConfig } from 'payload'
import revalidateWidgetPages from './hooks/revalidateWidgetPages'

export const NACWidgetsConfig: GlobalConfig = {
  slug: 'nacWidgetsConfig',
  label: 'NAC Widgets Config',
  admin: {
    group: 'Settings',
  },
  access: accessByGlobalRole('nacWidgetsConfig'),
  fields: [
    {
      type: 'ui',
      name: 'description',
      admin: {
        components: {
          Field: '@/globals/NACWidgetsConfig/components/Description#Description',
        },
      },
    },
    {
      type: 'text',
      name: 'version',
      required: true,
    },
    {
      type: 'text',
      name: 'baseUrl',
      defaultValue: 'https://du6amfiq9m9h7.cloudfront.net/public/v2',
      validate: validateExternalUrl,
      required: true,
    },
  ],
  hooks: {
    afterChange: [revalidateWidgetPages],
  },
}
