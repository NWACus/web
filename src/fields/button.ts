import type { Field, GroupField } from 'payload'
import { linkToPageOrPost } from './linkToPageOrPost'

export type ButtonAppearances =
  | 'default'
  | 'destructive'
  | 'ghost'
  | 'link'
  | 'outline'
  | 'secondary'

export const appearanceOptions: Record<ButtonAppearances, { label: string; value: string }> = {
  default: {
    label: 'Default',
    value: 'default',
  },
  destructive: {
    label: 'Destructive',
    value: 'destructive',
  },
  ghost: {
    label: 'Ghost',
    value: 'ghost',
  },
  link: {
    label: 'Link',
    value: 'link',
  },
  outline: {
    label: 'Outline',
    value: 'outline',
  },
  secondary: {
    label: 'Secondary',
    value: 'secondary',
  },
}

type ButtonType = (appearances: ButtonAppearances[]) => Field

export const button: ButtonType = (appearances) => {
  const buttonResults: GroupField = {
    name: 'button',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields: [...linkToPageOrPost],
  }
  if (appearances.length > 1) {
    const appearanceOptionsToUse = appearances.map((appearance) => appearanceOptions[appearance])

    buttonResults.fields.push({
      name: 'appearance',
      type: 'select',
      admin: {
        description: 'Choose how the link should be rendered.',
      },
      defaultValue: appearanceOptionsToUse[0].value,
      options: appearanceOptionsToUse,
    })
  }

  return buttonResults
}
