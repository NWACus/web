import { navLink } from '@/fields/navLink'
import { Field, Tab, toWords } from 'payload'
import { itemsField } from './itemsField'

export type DisplayMode = 'dropdown' | 'link' | 'button'

const isDisplayMode = (value: unknown): value is DisplayMode =>
  value === 'dropdown' || value === 'link' || value === 'button'

const MODE_OPTIONS: { label: string; value: DisplayMode }[] = [
  { label: 'Dropdown — a menu of sub-items', value: 'dropdown' },
  { label: 'Link — a single clickable link to one page', value: 'link' },
  { label: 'Button — a styled call-to-action button', value: 'button' },
]

const getMode = (siblingData: unknown): DisplayMode | null => {
  if (typeof siblingData !== 'object' || siblingData === null) return null
  if (!('options' in siblingData)) return null
  const options = siblingData.options
  if (typeof options !== 'object' || options === null) return null
  if (!('displayMode' in options)) return null
  return isDisplayMode(options.displayMode) ? options.displayMode : null
}

/**
 * Unified helper for navigation tabs. Every tab has the same shape; its rendering
 * (dropdown, single link, or button) is controlled by the `options.displayMode` field.
 */
export const navTab = ({
  name,
  description,
  defaultMode = 'dropdown',
  hasEnabledToggle = true,
  enabledToggleDescription = 'If hidden, pages with links in this nav item will not be accessible at their navigation-nested URLs.',
}: {
  name: string
  description?: string
  defaultMode?: DisplayMode
  hasEnabledToggle?: boolean
  enabledToggleDescription?: string
}): Tab => {
  const displayModeField: Field = {
    name: 'displayMode',
    type: 'radio',
    defaultValue: defaultMode,
    options: MODE_OPTIONS,
    admin: {
      layout: 'vertical',
    },
  }

  const enabledField: Field = {
    type: 'checkbox',
    defaultValue: true,
    name: 'enabled',
    label: 'Show in navigation',
    admin: { description: enabledToggleDescription },
  }

  const optionsGroup: Field = {
    type: 'group',
    name: 'options',
    fields: hasEnabledToggle ? [displayModeField, enabledField] : [displayModeField],
  }

  const linkField: Field = {
    ...navLink,
    label: '',
    admin: {
      ...navLink.admin,
      condition: (_, siblingData) => {
        const mode = getMode(siblingData)
        return mode === 'link' || mode === 'button'
      },
    },
  }

  const items: Field = itemsField({
    label: `${toWords(name)} Nav Items`,
    description: `Dropdown items under ${toWords(name)}`,
    overrides: {
      admin: {
        condition: (_, siblingData) => getMode(siblingData) === 'dropdown',
      },
    },
  })

  let fields: Field[] = [optionsGroup, linkField, items]

  if (description) {
    const descriptionField: Field = {
      type: 'ui',
      name: `${name}Description`,
      admin: {
        components: {
          Field: {
            path: '@/components/BannerDescription#BannerDescription',
            clientProps: { message: description, type: 'info' },
          },
        },
      },
    }
    fields = [descriptionField, ...fields]
  }

  return { name, fields }
}
