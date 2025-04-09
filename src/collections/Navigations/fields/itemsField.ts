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
          name: 'options',
          type: 'group',
          label: 'Options',
          fields: [
            {
              name: 'hasNavItems',
              type: 'checkbox',
              label: 'Has Sub Nav Items',
              defaultValue: false,
              admin: {
                description:
                  'Controls whether this item will show a dropdown menu of sub nav items on hover.',
              },
            },
          ],
        },
        {
          name: 'items',
          type: 'array',
          label: 'Third-level Nav Items',
          admin: {
            condition: (_data, siblingData) => siblingData?.options.hasNavItems,
          },
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
