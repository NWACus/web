import { getTenantFilter } from '@/utilities/collectionFilters'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { Field, TextFieldSingleValidation } from 'payload'

const validateLabel: TextFieldSingleValidation = (val, { siblingData }) => {
  if (siblingData && typeof siblingData === 'object' && 'type' in siblingData) {
    if (siblingData.type === 'internal') return true
  }

  return Boolean(val) || 'You must define a label for an external link.'
}

export const linkToPageOrPost: Field[] = [
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
          condition: (_, siblingData) => siblingData?.type === 'internal',
          width: '50%',
        },
        label: 'Select page or post',
        relationTo: ['pages', 'builtInPages', 'posts'],
        required: true,
        filterOptions: getTenantFilter,
      },
      {
        name: 'url',
        type: 'text',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'external',
          width: '50%',
        },
        label: 'External URL',
        validate: validateExternalUrl,
      },
      {
        name: 'label',
        type: 'text',
        admin: {
          width: '50%',
        },
        label: 'Label',
        validate: validateLabel,
      },
    ],
  },
]
