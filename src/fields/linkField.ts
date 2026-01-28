import { clearIrrelevantLinkValues } from '@/utilities/clearIrrelevantLinkValues'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { Field, NamedGroupField, TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'

const validateLabel: TextFieldSingleValidation = (val, args) => {
  const { siblingData } = args
  if (siblingData && typeof siblingData === 'object' && 'type' in siblingData) {
    if (siblingData.type === 'internal') return text(val, args)
  }
  return Boolean(val) ? text(val, args) : 'You must define a label for an external link.'
}

const linkReferenceRow = (includeLabel = false): Field[] => {
  const fields: Field[] = [
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
        width: '100%',
      },
      label: 'External URL',
      validate: validateExternalUrl,
    },
  ]

  if (includeLabel) {
    fields.push({
      name: 'label',
      type: 'text',
      admin: { width: '50%' },
      label: 'Label',
      validate: validateLabel,
    })
  }

  return fields
}

export const linkToPageOrPost = (includeLabel = false): Field[] => [
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
          { label: 'Internal link', value: 'internal' },
          { label: 'External link', value: 'external' },
        ],
      },
      {
        name: 'newTab',
        type: 'checkbox',
        admin: {
          style: {
            alignSelf: 'flex-end',
            alignItems: 'flex-end',
            marginBottom: '4px',
          },
          width: '50%',
        },
        label: 'Open in new tab',
      },
    ],
  },
  {
    type: 'row',
    fields: linkReferenceRow(includeLabel),
  },
]

export const linkField = ({
  fieldName = 'link',
  includeLabel = false,
}: {
  fieldName?: string
  includeLabel?: boolean
} = {}): NamedGroupField => ({
  name: fieldName,
  type: 'group',
  admin: {
    hideGutter: true,
  },
  hooks: {
    beforeChange: [clearIrrelevantLinkValues],
  },
  fields: linkToPageOrPost(includeLabel),
})
