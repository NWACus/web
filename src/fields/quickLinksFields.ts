import type { ArrayField } from 'payload'
import { linkToPageOrPost } from './linkField'

export const quickLinksField = ({ description }: { description?: string }): ArrayField => ({
  name: 'quickLinks',
  type: 'array',
  admin: {
    description,
  },
  fields: linkToPageOrPost(true),
})
