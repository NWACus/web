import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

export const PowDays: CollectionConfig = {
  slug: 'powDays',
  fields: [
    tenantField(),
    {
      name: 'inches',
      type: 'number',
    },
    contentHashField(),
  ],
}
