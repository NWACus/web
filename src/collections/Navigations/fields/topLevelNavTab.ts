import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { navLink } from '@/fields/navLink'
import { Field, Tab, toWords } from 'payload'
import { itemsField } from './itemsField'

export const topLevelNavTab = ({
  name,
  description,
  hasConfigurableNavItems = true,
  hasLandingPage = false,
  hasEnabledToggle = true,
  enabledToggleDescription = 'If hidden, pages with links in this nav item will not be accessible at their navigation-nested URLs.',
}: {
  name: string
  description?: string
  hasConfigurableNavItems?: boolean
  hasLandingPage?: boolean
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

  if (hasLandingPage) {
    fields = [
      {
        ...navLink,
        access: {
          update: hasSuperAdminPermissions,
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
    virtual: !hasConfigurableNavItems && !hasEnabledToggle && !hasLandingPage,
    fields,
  }
}
