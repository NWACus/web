import type { ArrayField } from 'payload'
import { linkFields } from './linkField'

export const quickLinksField = ({ description }: { description?: string }): ArrayField => ({
  name: 'quickLinks',
  type: 'array',
  admin: {
    description,
  },
  fields: linkFields(true),
})
