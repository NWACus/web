import { navLink } from '@/fields/navLink'
import { itemTypeOf } from '@/utilities/navItemType'
import { merge } from 'lodash-es'
import { ArrayField, Condition, Field, FieldHook } from 'payload'

const isSection: Condition = (_, siblingData) => itemTypeOf(siblingData) === 'section'
const isLink: Condition = (_, siblingData) => itemTypeOf(siblingData) === 'link'

const clearLabelUnlessSection: FieldHook = ({ siblingData, value }) =>
  itemTypeOf(siblingData) === 'section' ? value : null

const clearLinkUnlessLink: FieldHook = ({ siblingData, value }) => {
  if (itemTypeOf(siblingData) === 'link' || !value || typeof value !== 'object') return value
  // Null each sub-field rather than the group itself: Payload treats a null group as the
  // siblingData it traverses the group's sub-fields with, so returning null here makes every
  // sub-field hook throw. Nulling the sub-fields also actually clears the DB columns.
  return { type: 'internal', reference: null, url: null, label: null, newTab: null }
}

// Not stored: an item's type is whether it has sub-items. The picker switches it by adding or
// removing sub-items, carrying the link across.
const itemType: Field = {
  name: 'itemType',
  type: 'ui',
  admin: {
    components: {
      Field: '@/components/Navigations/ItemTypePicker#ItemTypePicker',
    },
  },
}

const sectionLabel: Field = {
  name: 'label',
  type: 'text',
  label: 'Section name',
  required: true,
  admin: {
    description: "Shown as the section's heading. Sections aren't clickable on the site.",
    condition: isSection,
  },
  hooks: {
    beforeChange: [clearLabelUnlessSection],
  },
}

const subItems: Field = {
  name: 'items',
  type: 'array',
  label: 'Sub-items',
  admin: {
    condition: isSection,
    components: {
      RowLabel: '@/components/Navigations/NavItemRowLabel#NavItemRowLabel',
    },
  },
  fields: [navLink],
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
        components: {
          RowLabel: '@/components/Navigations/NavItemRowLabel#NavItemRowLabel',
        },
      },
      fields: [
        itemType,
        sectionLabel,
        {
          ...navLink,
          admin: {
            ...navLink.admin,
            condition: isLink,
          },
          hooks: {
            // navLink.hooks contains clearIrrelevantLinkValues; we add our cleanup hook
            beforeChange: [...(navLink.hooks?.beforeChange ?? []), clearLinkUnlessLink],
          },
        },
        subItems,
      ],
    },
    overrides,
  )
