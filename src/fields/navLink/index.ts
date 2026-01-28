import { clearIrrelevantLinkValues } from '@/utilities/clearIrrelevantLinkValues'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { NamedGroupField, TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'

const validateLabel: TextFieldSingleValidation = (val, args) => {
  const { siblingData } = args
  if (siblingData && typeof siblingData === 'object' && 'type' in siblingData) {
    if (siblingData.type === 'internal') return text(val, args)
  }
  return Boolean(val) ? text(val, args) : 'You must define a label for an external link.'
}

export const navLink: NamedGroupField = {
  name: 'link',
  type: 'group',
  admin: {
    hideGutter: true,
  },
  hooks: {
    beforeChange: [clearIrrelevantLinkValues],
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
      label: 'Select page or post',
      relationTo: ['pages', 'builtInPages', 'posts'],
      filterOptions: getTenantFilter,
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
