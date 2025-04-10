import type { CheckboxField, TextField } from 'payload'

import { ensureUniqueSlug } from '@/fields/slug/ensureUniqueSlug'
import { formatSlugHook } from './formatSlug'

type Slug = (fieldToUse?: string) => [TextField, CheckboxField]

export const slugField: Slug = (fieldToUse = 'title') => {
  const checkBoxField: CheckboxField = {
    name: 'slugLock',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      hidden: true,
      position: 'sidebar',
    },
  }

  // Expect ts error here because of typescript mismatching Partial<TextField> with TextField
  const slugField: TextField = {
    name: 'slug',
    type: 'text',
    index: true,
    label: 'Slug',
    required: true,
    hooks: {
      // Kept this in for hook or API based updates
      beforeValidate: [formatSlugHook(fieldToUse), ensureUniqueSlug],
    },
    admin: {
      position: 'sidebar',
      components: {
        Field: {
          path: '@/fields/slug/SlugComponent#SlugComponent',
          clientProps: {
            fieldToUse,
            checkboxFieldPath: checkBoxField.name,
          },
        },
      },
    },
  }

  return [slugField, checkBoxField]
}
