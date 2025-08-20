import { getTenantFilter } from '@/utilities/collectionFilters'
import type { ArrayField } from 'payload'

export const quickLinksField = ({ description }: { description?: string }): ArrayField => ({
  name: 'quickLinks',
  type: 'array',
  admin: {
    description,
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
          label: 'Document to link to',
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
})
