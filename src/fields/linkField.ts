import { clearIrrelevantLinkValues } from '@/utilities/clearIrrelevantLinkValues'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { Field, NamedGroupField, TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'

const validateLabel: TextFieldSingleValidation = (val, args) => {
  const { siblingData } = args
  if (siblingData && typeof siblingData === 'object' && 'type' in siblingData) {
    if (siblingData.type === 'internal') return text(val, args)
  }
  return Boolean(val) ? text(val, args) : 'You must define a label for an external link.'
}

type LinkFieldsOptions = {
  includeLabel?: boolean
  /** When true, newTab checkbox only shows for external links and defaults to true */
  newTabForExternalOnly?: boolean
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
  newTabForExternalOnly = false,
  labelDescriptionComponent,
}: LinkFieldsOptions = {}): Field[] => {
  const newTabField: Field = {
    name: 'newTab',
    type: 'checkbox',
    admin: {
      ...(newTabForExternalOnly
        ? {
            condition: (_, siblingData) => siblingData?.type === 'external',
          }
        : {
            style: {
              alignSelf: 'flex-end',
              alignItems: 'flex-end',
              marginBottom: '4px',
            },
            width: '50%',
          }),
    },
    ...(newTabForExternalOnly ? { defaultValue: true } : {}),
    label: 'Open in new tab',
  }

  const referenceField: Field = {
    name: 'reference',
    type: 'relationship',
    admin: {
      condition: (_, siblingData) => siblingData?.type === 'internal',
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
        ...(newTabForExternalOnly ? [] : [newTabField]),
      ],
    },
    {
      type: 'row',
      fields: [referenceField, urlField, ...(includeLabel ? [labelField] : [])],
    },
    ...(newTabForExternalOnly ? [newTabField] : []),
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
 * // Navigation-style link (newTab only for external)
 * linkField({ includeLabel: true, newTabForExternalOnly: true })
 */
export const linkField = ({
  fieldName = 'link',
  includeLabel = false,
  newTabForExternalOnly = false,
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
  fields: buildLinkFields({ includeLabel, newTabForExternalOnly, labelDescriptionComponent }),
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
