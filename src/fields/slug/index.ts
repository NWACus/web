import { ensureUniqueSlug } from '@/fields/slug/ensureUniqueSlug'

export const slugField = (fieldToUse: string = 'title') => ({
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
