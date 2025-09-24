import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { CollectionConfig, Field } from 'payload'

export const linkChoiceRow: Field[] = [
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
            alignItems: 'flex-end',
            marginBottom: '4px',
          },
          width: '50%',
        },
        label: 'Open in new tab',
      },
    ],
  },
]
export const linkDataRow: Field[] = [
  {
    name: 'reference',
    type: 'relationship',
    admin: {
      condition: (_, siblingData) => siblingData?.type === 'internal',
      width: '50%',
    },
    label: 'Select page or post',
    relationTo: ['posts', 'builtInPages'],
    required: true,
    // filterOptions: getTenantFilter,
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

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  access: accessByTenantRole('redirects'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Settings',
    useAsTitle: 'from',
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      index: true,
      label: 'From URL',
      required: true,
      unique: true,
    },
    {
      name: 'to',
      type: 'group',
      admin: {
        hideGutter: true,
      },
      fields: [
        ...linkChoiceRow,
        {
          type: 'row',
          fields: [...linkDataRow],
        },
      ],
    },
    tenantField(),
    contentHashField(),
  ],
  // hooks: {
  //   afterChange: [revalidateRedirect],
  //   afterDelete: [revalidateRedirectDelete],
  // },
}
