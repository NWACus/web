import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Field, GroupField } from 'payload'

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
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            type: 'radio',
            admin: {
              layout: 'horizontal',
              width: '50%',
            },
            defaultValue: 'reference',
            options: [
              {
                label: 'Internal button',
                value: 'reference',
              },
              {
                label: 'Custom URL',
                value: 'custom',
              },
            ],
          },
          {
            name: 'newTab',
            type: 'checkbox',
            admin: {
              style: {
                alignSelf: 'flex-end',
              },
              width: '50%',
            },
            label: 'Open in new tab',
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'reference',
            type: 'relationship',
            admin: {
              condition: (_, siblingData) => siblingData?.type === 'reference',
              width: '50%',
            },
            label: 'Document to button to',
            relationTo: ['pages', 'posts'],
            required: true,
            filterOptions: getTenantFilter,
          },
          {
            name: 'url',
            type: 'text',
            admin: {
              condition: (_, siblingData) => siblingData?.type === 'custom',
              width: '50%',
            },
            label: 'Custom URL',
            required: true,
          },
          {
            name: 'label',
            type: 'text',
            admin: {
              width: '50%',
            },
            label: 'Label',
            required: true,
          },
        ],
      },
    ],
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
