import { navLink } from '@/fields/navLink'
import { isRecord } from '@/utilities/isRecord'
import { get, merge } from 'lodash-es'
import { ArrayField, Condition, Field, FieldHook, RelationshipFieldValidation } from 'payload'
import { relationship } from 'payload/shared'

// Condition: show field only when item has sub-items (accordion/section mode)
const hasSubItems: Condition = (_, siblingData) =>
  Array.isArray(siblingData?.items) && siblingData.items.length > 0

const clearLabelWhenItemHasNoSubItems: FieldHook = ({ siblingData, value }) => {
  const items = siblingData?.items
  const hasItems = Array.isArray(items) && items.length > 0
  if (!hasItems && value) {
    return null
  }

  return value
}

// A section header's link isn't rendered, so its page is optional. The validator sits on
// link.reference, so step up past `reference` and `link` to reach the nav item.
const validateItemReference: RelationshipFieldValidation = (value, options) => {
  const item: unknown = get(options.data, options.path.slice(0, -2))
  const hasItems = isRecord(item) && Array.isArray(item.items) && item.items.length > 0
  return relationship(value, { ...options, required: !hasItems })
}

const withItemReferenceValidation = (fields: Field[]): Field[] =>
  fields.map((field) => {
    if (field.type === 'row') return { ...field, fields: withItemReferenceValidation(field.fields) }
    if (field.type === 'relationship' && field.name === 'reference')
      return merge({}, field, {
        validate: validateItemReference,
        admin: {
          components: {
            Label: '@/components/Navigations/ItemLinkReferenceLabel#ItemLinkReferenceLabel',
          },
        },
      })
    return field
  })

export const itemsField = ({
  label,
  description,
  overrides = {},
}: {
  label: string
  description?: string
  overrides?: Partial<ArrayField>
}): ArrayField =>
  merge(
    {
      name: 'items',
      type: 'array',
      label,
      admin: {
        description,
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'Label for this nav section (shown when item has sub-items)',
            condition: hasSubItems,
          },
          hooks: {
            beforeChange: [clearLabelWhenItemHasNoSubItems],
          },
        },
        {
          ...navLink,
          fields: withItemReferenceValidation(navLink.fields),
        },
        {
          name: 'items',
          type: 'array',
          label: 'Sub Nav Items',
          fields: [navLink],
        },
      ],
    },
    overrides,
  )
