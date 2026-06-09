import { ensureUniqueSlug } from '@/fields/slug/ensureUniqueSlug'
import { validateSlug } from '@/utilities/validateSlug'
import { FieldHook, TextField } from 'payload'

export const setDuplicateSlug: FieldHook = async ({ value }) => {
  if (!value || typeof value !== 'string') {
    return value
  }

  return `${value}-copy`
}

type SlugFieldOptions = {
  // When set, the slug auto-generates from `${fieldToUse}` plus this date field (as `-YYYY-MM-DD`)
  // whenever it's left blank, and duplicates are resolved by appending `-2`, `-3`, ... instead of
  // erroring. Used for collections like events where many documents share the same title.
  autoGenerateFromDateField?: string
}

export const slugField = (
  fieldToUse: string = 'title',
  options: SlugFieldOptions = {},
): TextField => {
  const autoGenerate = !!options.autoGenerateFromDateField

  return {
    name: 'slug',
    type: 'text',
    index: true,
    label: 'Slug',
    // When auto-generating, the slug may be left blank — the hook fills it in before validation.
    required: !autoGenerate,
    hooks: {
      beforeDuplicate: [setDuplicateSlug],
      beforeValidate: [
        ensureUniqueSlug({
          generateFromField: autoGenerate ? fieldToUse : undefined,
          dateField: options.autoGenerateFromDateField,
          autoSuffixOnDuplicate: autoGenerate,
        }),
      ],
    },
    validate: validateSlug,
    admin: {
      position: 'sidebar',
      description: autoGenerate
        ? 'Leave blank to auto-generate from the title and start date. Duplicates are numbered automatically.'
        : undefined,
      components: {
        Field: {
          path: '@/fields/slug/SlugComponent#SlugComponent',
          clientProps: {
            fieldToUse,
          },
        },
      },
    },
  }
}
