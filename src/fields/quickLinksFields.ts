import type { ArrayField } from 'payload'
import { linkToPageOrPostWithLabel } from './linkToPageOrPost'

export const quickLinksField = ({ description }: { description?: string }): ArrayField => ({
  name: 'quickLinks',
  type: 'array',
  admin: {
    description,
  },
  fields: [...linkToPageOrPostWithLabel],
})
