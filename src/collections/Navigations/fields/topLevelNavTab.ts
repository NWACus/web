import { navLink } from '@/fields/navLink'
import { Tab, toWords } from 'payload'
import { itemsField } from './itemsField'

export const topLevelNavTab = ({
  name,
  description,
  isConfigurable = true,
}: {
  name: string
  description?: string
  isConfigurable?: boolean
}): Tab => ({
  name,
  description,
  virtual: !isConfigurable,
  fields: [
    ...(isConfigurable ? [navLink] : []),
    itemsField({
      label: `${toWords(name)} Nav Items`,
      description: `Dropdown items under ${toWords(name)}`,
      overrides: {
        admin: {
          hidden: !isConfigurable,
        },
      },
    }),
  ],
})
