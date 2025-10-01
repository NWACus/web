import { Field, Tab, toWords } from 'payload'
import { itemsField } from './itemsField'

export const topLevelNavTab = ({
  name,
  description,
  hasConfigurableNavItems = true,
  hasEnabledToggle = true,
}: {
  name: string
  description?: string
  hasConfigurableNavItems?: boolean
  hasEnabledToggle?: boolean
}): Tab => {
  let fields: Field[] = [
    itemsField({
      label: `${toWords(name)} Nav Items`,
      description: `Dropdown items under ${toWords(name)}`,
      overrides: {
        admin: {
          hidden: !hasConfigurableNavItems,
        },
      },
    }),
  ]

  if (hasEnabledToggle) {
    const enabledToggleField: Field = {
      type: 'group',
      name: 'options',
      fields: [
        {
          type: 'checkbox',
          defaultValue: true,
          name: 'enabled',
        },
      ],
    }
    fields = [enabledToggleField, ...fields]
  }

  return {
    name,
    description,
    virtual: !hasConfigurableNavItems && !hasEnabledToggle,
    fields,
  }
}
