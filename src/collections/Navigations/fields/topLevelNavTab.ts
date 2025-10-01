import { Field, Tab, toWords } from 'payload'
import { itemsField } from './itemsField'

export const topLevelNavTab = ({
  name,
  description,
  hasConfigurableNavItems = true,
  hasEnabledToggle = true,
  enabledToggleDescription = 'If hidden, pages with links in this nav item will not be accessible at their navigation-nested URLs.',
}: {
  name: string
  description?: string
  hasConfigurableNavItems?: boolean
  hasEnabledToggle?: boolean
  enabledToggleDescription?: string
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
      label: '',
      fields: [
        {
          type: 'checkbox',
          defaultValue: true,
          name: 'enabled',
          label: 'Show Item in Navigation',
          admin: {
            description: enabledToggleDescription,
          },
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
