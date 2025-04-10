import { navLink } from '@/fields/navLink'
import deepMerge from '@/utilities/deepMerge'
import { ArrayField } from 'payload'

export const itemsField = ({
  label,
  description,
  overrides = {},
}: {
  label: string
  description?: string
  overrides?: Partial<ArrayField>
}): ArrayField =>
  deepMerge(
    {
      name: 'items',
      type: 'array',
      label,
      admin: {
        description,
      },
      fields: [
        navLink,
        {
          name: 'items',
          type: 'array',
          label: 'Third-level Nav Items',
          fields: [navLink],
        },
      ],
    },
    overrides,
  )
