import { Field, Tab, toWords } from 'payload'
import { itemsField } from './itemsField'

export const topLevelNavTab = ({
  name,
  description,
  isConfigurable = true,
  hasEnabledToggle = true,
}: {
  name: string
  description?: string
  isConfigurable?: boolean
  hasEnabledToggle?: boolean
}): Tab => {
  let fields: Field[] = [
    itemsField({
      label: `${toWords(name)} Nav Items`,
      description: `Dropdown items under ${toWords(name)}`,
      overrides: {
        admin: {
          hidden: !isConfigurable,
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
    virtual: !isConfigurable,
    fields,
  }
}
