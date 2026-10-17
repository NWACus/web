import { navLink } from '@/fields/navLink'
import { isRecord } from '@/utilities/isRecord'
import { merge } from 'lodash-es'
import { ArrayField, Condition, Field, FieldHook } from 'payload'

// Condition: show field only when item has sub-items (accordion/section mode)
const hasSubItems: Condition = (_, siblingData) =>
  Array.isArray(siblingData?.items) && siblingData.items.length > 0

// The link still holds a page or URL that clearLinkWhenHasSubItems will drop on save
const isDroppingLink: Condition = (data, siblingData, ctx) => {
  const link = siblingData?.link
  return (
    hasSubItems(data, siblingData, ctx) && isRecord(link) && Boolean(link.reference || link.url)
  )
}

// Clear standalone label when sub-items are removed
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
    // Null each sub-field rather than the group itself: Payload treats a null group as the
    // siblingData it traverses the group's sub-fields with, so returning null here makes every
    // sub-field hook throw. Nulling the sub-fields also actually clears the DB columns.
    return { type: 'internal', reference: null, url: null, label: null, newTab: null }
  }

  return value
}

const sectionHeaderNote: Field = {
  name: 'sectionHeaderNote',
  type: 'ui',
  admin: {
    condition: isDroppingLink,
    components: {
      Field: {
        path: '@/components/BannerDescription#BannerDescription',
        clientProps: {
          message:
            "Items with sub-items show as a section header, so this item's link is no longer used and is removed when you save.",
          type: 'info',
        },
      },
    },
  },
}

const sectionLabel: Field = {
  name: 'label',
  type: 'text',
  required: true,
  admin: {
    description: 'Label for this nav section (shown when item has sub-items)',
    condition: hasSubItems,
    components: {
      Field: '@/components/Navigations/SectionLabelField#SectionLabelField',
    },
  },
  hooks: {
    beforeChange: [clearLabelWhenItemHasNoSubItems],
  },
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
        sectionHeaderNote,
        sectionLabel,
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
