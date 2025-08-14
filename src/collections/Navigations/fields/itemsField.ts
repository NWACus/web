import { navLink } from '@/fields/navLink'
import { merge } from 'lodash-es'
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
  merge(
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
          label: 'Sub Nav Items',
          fields: [navLink],
        },
      ],
    },
    overrides,
  )
