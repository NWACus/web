import { ensureUniqueSlug } from '@/fields/slug/ensureUniqueSlug'
import { TextField } from 'payload'

export const slugField = (fieldToUse: string = 'title'): TextField => ({
  name: 'slug',
  type: 'text',
  index: true,
  label: 'Slug',
  required: true,
  hooks: {
    beforeValidate: [ensureUniqueSlug],
  },
  admin: {
    position: 'sidebar',
    components: {
      Field: {
        path: '@/fields/slug/SlugComponent#SlugComponent',
        clientProps: {
          fieldToUse,
        },
      },
    },
  },
})
