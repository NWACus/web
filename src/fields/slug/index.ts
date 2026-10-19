import { ensureUniqueSlug, type SlugPrefixFrom } from '@/fields/slug/ensureUniqueSlug'
import { validateSlug } from '@/utilities/validateSlug'
import { FieldHook, TextField, TextFieldSingleValidation } from 'payload'

const setDuplicateSlug: FieldHook = async ({ value }) => {
  if (!value || typeof value !== 'string') {
    return value
  }

  return `${value}-copy`
}

/** Wraps `validateSlug` to also reject slugs that collide with sibling static routes. */
export const withReservedSlugs = (reserved: string[]): TextFieldSingleValidation => {
  const lower = new Set(reserved.map((s) => s.toLowerCase()))
  return (value, args) => {
    if (typeof value === 'string' && lower.has(value.toLowerCase())) {
      return `"${value}" is reserved — it conflicts with a static route and cannot be used as a slug.`
    }
    return validateSlug(value, args)
  }
}

type SlugFieldOptions = {
  // When set, the slug auto-generates from `${fieldToUse}` plus this date field (as `-YYYY-MM-DD`)
  // whenever it's left blank, and duplicates are resolved by appending `-2`, `-3`, ... instead of
  // erroring. Used for collections like events where many documents share the same title.
  autoGenerateFromDateField?: string
  // Prefixes the auto-generated slug with a related document's slug. For collections without a
  // tenant (e.g. courses), where same-titled documents from different owners would otherwise collide.
  prefixFromRelationship?: SlugPrefixFrom
  // Slugs that must be rejected because they collide with sibling static routes.
  reservedSlugs?: string[]
}

export const slugField = (
  fieldToUse: string = 'title',
  options: SlugFieldOptions = {},
): TextField => {
  const autoGenerate = !!options.autoGenerateFromDateField
  const prefixFrom = options.prefixFromRelationship

  return {
    name: 'slug',
    type: 'text',
    index: true,
    label: 'Slug',
    // When auto-generating, the slug may be left blank — the hook fills it in before validation.
    required: !autoGenerate,
    hooks: {
      // Auto-generating slugs copy verbatim on duplicate so ensureUniqueSlug resolves the
      // collision with a numbered suffix (-2, -3, …). Manual slugs append `-copy` to stay valid.
      beforeDuplicate: autoGenerate ? [] : [setDuplicateSlug],
      beforeValidate: [
        ensureUniqueSlug({
          generateFromField: autoGenerate ? fieldToUse : undefined,
          dateField: options.autoGenerateFromDateField,
          prefixFrom,
          autoSuffixOnDuplicate: autoGenerate,
        }),
      ],
    },
    validate: options.reservedSlugs?.length
      ? withReservedSlugs(options.reservedSlugs)
      : validateSlug,
    admin: {
      position: 'sidebar',
      description: autoGenerate
        ? `Leave blank to auto-generate from ${prefixFrom ? `${prefixFrom.field} + ` : ''}${fieldToUse} + start date. Duplicates get a numbered suffix.`
        : `Auto-generated from ${fieldToUse}. Must be unique; lowercase letters, numbers, and hyphens only.`,
      components: {
        Field: {
          path: '@/fields/slug/SlugComponent#SlugComponent',
          clientProps: {
            fieldToUse,
            dateField: options.autoGenerateFromDateField,
            prefixFrom,
          },
        },
      },
    },
  }
}
