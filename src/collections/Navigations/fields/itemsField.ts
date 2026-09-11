import { navLink } from '@/fields/navLink'
import { merge } from 'lodash-es'
import { ArrayField, Condition, FieldHook } from 'payload'

// Condition: show field only when item has sub-items (accordion/section mode)
const hasSubItems: Condition = (_, siblingData) =>
  Array.isArray(siblingData?.items) && siblingData.items.length > 0

// Copy link.label to standalone label when sub-items are added,
// and clear standalone label when sub-items are removed
const clearLabelWhenItemHasNoSubItems: FieldHook = ({ siblingData, value }) => {
  const items = siblingData?.items
  const hasItems = Array.isArray(items) && items.length > 0
  // If item has no sub-items, clear the standalone label (it's not used)
  if (!hasItems && value) {
    return null
  }

  return value
}

// Clear link data when item has sub-items (link is not used for accordion items)
const clearLinkWhenHasSubItems: FieldHook = ({ siblingData, value }) => {
  const items = siblingData?.items
  const hasItems = Array.isArray(items) && items.length > 0

  if (hasItems && value && typeof value === 'object') {
    // Item has sub-items, clear the link data to avoid stale data in database.
    // Null each sub-field rather than the group itself: Payload treats a null group as the
    // siblingData it traverses the group's sub-fields with, so returning null here makes every
    // sub-field hook throw. Nulling the sub-fields also actually clears the DB columns.
    return { type: 'internal', reference: null, url: null, label: null, newTab: null }
  }

  return value
}

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
          admin: {
            ...navLink.admin,
            condition: (...args: Parameters<Condition>) => !hasSubItems(...args),
          },
          hooks: {
            // navLink.hooks contains clearIrrelevantLinkValues; we add our cleanup hook
            beforeChange: [...(navLink.hooks?.beforeChange ?? []), clearLinkWhenHasSubItems],
          },
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
