import type { Field, GroupField } from 'payload'
import { linkField } from './linkField'

export type ButtonVatiants = 'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'

export const variantOptions: Record<ButtonVatiants, { label: string; value: string }> = {
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

type ButtonType = (variants: ButtonVatiants[]) => Field

export const buttonField: ButtonType = (variants) => {
  const buttonResults: GroupField = linkField({ fieldName: 'button', includeLabel: true })

  if (variants.length > 1) {
    const variantOptionsToUse = variants.map((variant) => variantOptions[variant])

    buttonResults.fields.push({
      name: 'variant',
      type: 'select',
      admin: {
        description: 'Choose the button style.',
      },
      defaultValue: variantOptionsToUse[0].value,
      options: variantOptionsToUse,
    })
  }

  return buttonResults
}
