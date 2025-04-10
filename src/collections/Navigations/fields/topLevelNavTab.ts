import { navLink } from '@/fields/navLink'
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
  fields: [
    ...(isConfigurable ? [navLink] : []),
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
