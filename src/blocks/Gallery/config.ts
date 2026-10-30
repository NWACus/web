import { layoutField } from '@/fields/layout'
import { getTenantFilter } from '@/utilities/collectionFilters'
import type { Block } from 'payload'

export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  imageURL: '/thumbnail/GalleryThumbnail.jpg',
  labels: {
    singular: 'Media Gallery',
    plural: 'Media Galleries',
  },
  fields: [
    {
      name: 'gallery',
      type: 'relationship',
      relationTo: 'galleries',
      hasMany: false,
      required: true,
      filterOptions: getTenantFilter,
    },
    {
      name: 'description',
      type: 'richText',
      required: false,
      admin: {
        description: 'Optional rich text shown above the gallery. Supports links.',
      },
    },
    layoutField([
      {
        type: 'row',
        fields: [
          {
            name: 'layout',
            type: 'select',
            required: true,
            defaultValue: 'grid',
            options: [
              { label: 'Grid', value: 'grid' },
              { label: 'Masonry', value: 'masonry' },
            ],
          },
          {
            name: 'columns',
            type: 'select',
            required: true,
            defaultValue: '4',
            options: [
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
            ],
          },
        ],
      },
    ]),
  ],
}
