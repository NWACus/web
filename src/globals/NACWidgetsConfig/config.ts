import { accessByGlobalRole } from '@/access/byGlobalRole'
import isAbsoluteUrl from '@/utilities/isAbsoluteUrl'
import type { GlobalConfig, TextFieldSingleValidation } from 'payload'
import revalidateWidgetPages from './hooks/revalidateWidgetPages'

const validateExternalUrl: TextFieldSingleValidation = (val) =>
  isAbsoluteUrl(val) || 'URL must be an absolute url with a protocol. I.e. https://www.example.com.'

export const NACWidgetsConfig: GlobalConfig = {
  slug: 'nacWidgetsConfig',
  label: 'NAC Widgets Config',
  admin: {
    description: 'Controls the loading of NAC widgets across all avalanche center websites.',
  },
  access: accessByGlobalRole('nacWidgetsConfig'),
  fields: [
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
