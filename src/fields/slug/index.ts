import { ensureUniqueSlug } from '@/fields/slug/ensureUniqueSlug'
import { validateSlug } from '@/utilities/validateSlug'

export const slugField = (fieldToUse: string = 'title') => ({
  name: 'slug',
  type: 'text',
  index: true,
  label: 'Slug',
  required: true,
  hooks: {
    beforeValidate: [ensureUniqueSlug],
  },
  validate: validateSlug,
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
