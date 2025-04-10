import { link } from '@/fields/link'
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
        link({
          appearances: false,
        }),
        {
          name: 'items',
          type: 'array',
          label: 'Third-level Nav Items',
          fields: [
            link({
              appearances: false,
            }),
          ],
        },
      ],
    },
    overrides,
  )
