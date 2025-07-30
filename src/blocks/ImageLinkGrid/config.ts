import { getImageTypeFilter, getTenantFilter } from '@/utilities/collectionFilters'
import type { Block } from 'payload'

import type { GroupField } from 'payload'

const linkField: GroupField = {
  name: 'link',
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
              label: 'Internal link',
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
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference',
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
      },
      label: 'Custom URL',
      required: true,
    },
  ],
}

export const ImageLinkGrid: Block = {
  slug: 'imageLinkGrid',
  interfaceName: 'ImageLinkGrid',
  imageURL: '/thumbnail/ImageLinkGridThumbnail.jpg',
  fields: [
    {
      name: 'columns',
      label: '',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: getImageTypeFilter,
        },
        { ...linkField },
        {
          name: 'caption',
          type: 'text',
          required: true,
        },
      ],
      labels: {
        singular: 'Image',
        plural: 'Images',
      },
      maxRows: 4,
    },
  ],
}
