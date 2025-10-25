import { ensureUniqueSlug } from '@/fields/slug/ensureUniqueSlug'
import { validateSlug } from '@/utilities/validateSlug'
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
