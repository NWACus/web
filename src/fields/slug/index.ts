import { ensureUniqueSlug } from '@/fields/slug/ensureUniqueSlug'
import { validateSlug } from '@/utilities/validateSlug'
import { FieldHook, TextField } from 'payload'

export const getDuplicateSlug: FieldHook = async ({ value }) => {
  if (!value || typeof value !== 'string') {
    return value
  }

  return `${value}-copy`
}

export const slugField = (fieldToUse: string = 'title'): TextField => ({
  name: 'slug',
  type: 'text',
  index: true,
  label: 'Slug',
  required: true,
  hooks: {
    beforeDuplicate: [getDuplicateSlug],
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
