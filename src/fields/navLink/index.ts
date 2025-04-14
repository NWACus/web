import isAbsoluteUrl from '@/utilities/isAbsoluteUrl'
import { GroupField, TextFieldSingleValidation } from 'payload'

const validateExternalUrl: TextFieldSingleValidation = (val) =>
  isAbsoluteUrl(val) ||
  'External URL must be an absolute url with a protocol. I.e. https://www.example.com.'

const validateLabel: TextFieldSingleValidation = (val, { siblingData }) => {
  if (siblingData && typeof siblingData === 'object' && 'type' in siblingData) {
    if (siblingData.type === 'internal') return true
  }

  return Boolean(val) || 'You must define a label for an external link.'
}

export const navLink: GroupField = {
  name: 'link',
  type: 'group',
  admin: {
    hideGutter: true,
  },
  fields: [
    {
      name: 'type',
      type: 'radio',
      defaultValue: 'internal',
      options: [
        {
          label: 'Internal link',
          value: 'internal',
        },
        {
          label: 'External link',
          value: 'external',
        },
      ],
    },
    {
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'internal',
      },
      label: 'Document to link to',
      relationTo: ['pages', 'posts'],
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'external',
      },
      label: 'External URL',
      validate: validateExternalUrl,
    },
    {
      name: 'label',
      type: 'text',
      admin: {
        components: {
          Description: '@/fields/navLink/components/LinkLabelDescription#LinkLabelDescription',
        },
      },
      label: 'Label',
      validate: validateLabel,
    },
    {
      name: 'newTab',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'external',
      },
      label: 'Open in new tab',
    },
  ],
}
