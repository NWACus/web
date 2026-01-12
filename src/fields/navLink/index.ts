import { getTenantFilter } from '@/utilities/collectionFilters'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { FieldHook, NamedGroupField, TextFieldSingleValidation } from 'payload'

const validateLabel: TextFieldSingleValidation = (val, { siblingData }) => {
  if (siblingData && typeof siblingData === 'object' && 'type' in siblingData) {
    if (siblingData.type === 'internal') return true
  }

  return Boolean(val) || 'You must define a label for an external link.'
}

const clearIrrelevantLinkValues: FieldHook = ({ value }) => {
  // Skip if not a link object
  if (value === null || typeof value !== 'object') return value

  const { type } = value

  if (type === 'internal') {
    // Clear external-only fields when switching to internal
    const { url: _url, newTab: _newTab, ...rest } = value
    return rest
  }

  if (type === 'external') {
    // Clear internal-only field when switching to external
    const { reference: _reference, ...rest } = value
    return rest
  }

  return value
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
