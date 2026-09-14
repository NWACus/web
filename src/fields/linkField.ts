import { clearIrrelevantLinkValues } from '@/utilities/clearIrrelevantLinkValues'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { isRecord } from '@/utilities/isRecord'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { Field, FieldHook, NamedGroupField, TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'

const validateLabel: TextFieldSingleValidation = (val, args) => {
  const { siblingData } = args
  if (siblingData && typeof siblingData === 'object' && 'type' in siblingData) {
    if (siblingData.type === 'internal') return text(val, args)
  }
  return Boolean(val) ? text(val, args) : 'You must define a label for an external link.'
}

// Runs at the field level so it also covers link fields used directly on array rows, which have no
// group hook.
//
// Only links that resolve to a reference are cleared. Legacy rows typed internal that carry just a
// url still render as external links, because handleReferenceURL falls back to url when there is no
// reference, so their newTab value is left as-is rather than silently changed on the next save.
const clearNewTabForInternalLink: FieldHook = ({ siblingData, value }) => {
  if (isRecord(siblingData) && siblingData.type === 'internal' && siblingData.reference) return null
  return value
}

type LinkFieldsOptions = {
  includeLabel?: boolean
  /** When true, the newTab checkbox renders on its own row and defaults to checked */
  newTabDefaultsToChecked?: boolean
  /** Custom admin Description component path for the label field */
  labelDescriptionComponent?: string
}

type LinkFieldOptions = LinkFieldsOptions & {
  fieldName?: string
}

/**
 * Builds the raw link fields array.
 * Used internally by linkField and exported as linkFields for array contexts.
 */
const buildLinkFields = ({
  includeLabel = false,
  newTabDefaultsToChecked = false,
  labelDescriptionComponent,
}: LinkFieldsOptions = {}): Field[] => {
  const newTabField: Field = {
    name: 'newTab',
    type: 'checkbox',
    admin: {
      condition: (_, siblingData) => siblingData?.type === 'external',
      ...(newTabDefaultsToChecked
        ? {}
        : {
            style: {
              alignSelf: 'flex-end',
              alignItems: 'flex-end',
              marginBottom: '4px',
            },
            width: '50%',
          }),
    },
    ...(newTabDefaultsToChecked ? { defaultValue: true } : {}),
    hooks: {
      beforeChange: [clearNewTabForInternalLink],
    },
    label: 'Open in new tab',
  }

  const referenceField: Field = {
    name: 'reference',
    type: 'relationship',
    admin: {
      condition: (_, siblingData) => siblingData?.type === 'internal',
      sortOptions: { pages: 'title', builtInPages: 'title', posts: 'title' },
      width: '50%',
    },
    label: 'Select page or post',
    relationTo: ['pages', 'builtInPages', 'posts'],
    required: true,
    filterOptions: getTenantFilter,
  }

  const urlField: Field = {
    name: 'url',
    type: 'text',
    admin: {
      condition: (_, siblingData) => siblingData?.type === 'external',
      width: '100%',
    },
    label: 'External URL',
    validate: validateExternalUrl,
  }

  const labelField: Field = {
    name: 'label',
    type: 'text',
    admin: {
      width: '50%',
      ...(labelDescriptionComponent
        ? {
            components: {
              Description: labelDescriptionComponent,
            },
          }
        : {}),
    },
    label: 'Label',
    validate: validateLabel,
  }

  return [
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'radio',
          admin: {
            layout: 'horizontal',
            width: '50%',
          },
          defaultValue: 'internal',
          options: [
            { label: 'Internal link', value: 'internal' },
            { label: 'External link', value: 'external' },
          ],
        },
        ...(newTabDefaultsToChecked ? [] : [newTabField]),
      ],
    },
    {
      type: 'row',
      fields: [referenceField, urlField, ...(includeLabel ? [labelField] : [])],
    },
    ...(newTabDefaultsToChecked ? [newTabField] : []),
  ]
}

/**
 * Creates a link group field with configurable options.
 *
 * @example
 * // Basic usage
 * linkField()
 *
 * @example
 * // With custom field name and label
 * linkField({ fieldName: 'button', includeLabel: true })
 *
 * @example
 * // Navigation-style link (newTab on its own row, checked by default)
 * linkField({ includeLabel: true, newTabDefaultsToChecked: true })
 */
export const linkField = ({
  fieldName = 'link',
  includeLabel = false,
  newTabDefaultsToChecked = false,
  labelDescriptionComponent,
}: LinkFieldOptions = {}): NamedGroupField => ({
  name: fieldName,
  type: 'group',
  admin: {
    hideGutter: true,
  },
  hooks: {
    beforeChange: [clearIrrelevantLinkValues],
  },
  fields: buildLinkFields({ includeLabel, newTabDefaultsToChecked, labelDescriptionComponent }),
})

/**
 * Returns the raw link fields array for use in array field contexts.
 * Use this when you need the fields directly on array items without a group wrapper.
 *
 * @example
 * // In an array field
 * {
 *   name: 'quickLinks',
 *   type: 'array',
 *   fields: linkFields(true), // includeLabel
 * }
 */
export const linkFields = (includeLabel = false): Field[] => buildLinkFields({ includeLabel })
