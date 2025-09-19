import { linkToPageOrPost } from '@/fields/linkToPageOrPost'
import { getImageTypeFilter } from '@/utilities/collectionFilters'
import type { Block } from 'payload'

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
        {
          name: 'link',
          type: 'group',
          admin: {
            hideGutter: true,
          },
          fields: [...linkToPageOrPost],
        },
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
