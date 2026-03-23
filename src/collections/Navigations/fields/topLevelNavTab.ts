import { navLink } from '@/fields/navLink'
import { Field, Tab, toWords } from 'payload'
import { itemsField } from './itemsField'

export const topLevelNavTab = ({
  name,
  description,
  hasConfigurableNavItems = true,
  hasReadOnlyLink = false,
  hasReadOnlyNavItems = false,
  hasEnabledToggle = true,
  enabledToggleDescription = 'If hidden, pages with links in this nav item will not be accessible at their navigation-nested URLs.',
}: {
  name: string
  description?: string
  hasConfigurableNavItems?: boolean
  hasReadOnlyLink?: boolean
  hasReadOnlyNavItems?: boolean
  hasEnabledToggle?: boolean
  enabledToggleDescription?: string
}): Tab => {
  let fields: Field[] = [
    itemsField({
      label: `${toWords(name)} Nav Items`,
      description: `Dropdown items under ${toWords(name)}`,
      hasSubNavItems: !hasReadOnlyNavItems,
      overrides: {
        admin: {
          hidden: !hasConfigurableNavItems && !hasReadOnlyNavItems,
          readOnly: hasReadOnlyNavItems,
        },
      },
    }),
  ]

  if (hasReadOnlyLink) {
    fields = [
      {
        ...navLink,
        admin: {
          ...navLink.admin,
          readOnly: true,
        },
      },
      ...fields,
    ]
  }

  if (description) {
    const descriptionField: Field = {
      type: 'ui',
      name: `${name}Description`,
      admin: {
        components: {
          Field: {
            path: '@/components/BannerDescription#BannerDescription',
            clientProps: {
              message: description,
              type: 'info',
            },
          },
        },
      },
    }
    fields = [descriptionField, ...fields]
  }

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
    virtual:
      !hasConfigurableNavItems && !hasReadOnlyNavItems && !hasEnabledToggle && !hasReadOnlyLink,
    fields,
  }
}
