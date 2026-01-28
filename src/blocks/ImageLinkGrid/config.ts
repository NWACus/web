import { linkField } from '@/fields/linkField'
import { getImageTypeFilter } from '@/utilities/collectionFilters'
import type { Block } from 'payload'

export const ImageLinkGridBlock: Block = {
  slug: 'imageLinkGrid',
  interfaceName: 'ImageLinkGridBlock',
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
        linkField(),
        {
          name: 'caption',
          type: 'text',
          required: true,
          admin: {
            description: 'Insert text that will overlay the image',
          },
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
