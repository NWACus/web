import { link } from '@/fields/link'
import { Tab } from 'payload'
import { itemsField } from './itemsField'

export const topLevelNavTab = ({
  name,
  label,
  description,
  isConfigurable = true,
}: {
  name: string
  label?: string
  description?: string
  isConfigurable?: boolean
}): Tab => ({
  name,
  label,
  description,
  virtual: !isConfigurable,
  fields: [
    {
      name: 'options',
      type: 'group',
      label: 'Options',
      admin: {
        hidden: !isConfigurable,
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Is Enabled',
          defaultValue: true,
          admin: {
            description: 'Controls whether this shows up in the nav bar.',
          },
        },
        {
          name: 'clickable',
          type: 'checkbox',
          label: 'Is Clickable',
          defaultValue: false,
          admin: {
            description:
              "Controls whether this nav item itself is clickable or if it will just display it's sub nav on hover.",
          },
        },
      ],
    },
    link({
      appearances: false,
      overrides: {
        admin: {
          condition: (_data, siblingData) => siblingData?.options.clickable,
        },
      },
    }),
    itemsField({
      label: `${label ?? name} Sub Nav Items`,
      description: `Dropdown items under ${label ?? name}`,
      overrides: {
        admin: {
          hidden: !isConfigurable,
        },
      },
    }),
  ],
})
