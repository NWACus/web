import type { Block } from 'payload'

export const DocumentBlock: Block = {
  slug: 'documentBlock',
  interfaceName: 'DocumentBlock',
  imageURL: '/thumbnail/DocumentThumbnail.jpg',
  fields: [
    {
      name: 'document',
      type: 'upload',
      relationTo: 'documents',
      required: true,
    },
    {
      name: 'wrapInContainer',
      admin: {
        description:
          'Checking this will render the block with additional padding around it and using the background color you have selected.',
      },
      type: 'checkbox',
      defaultValue: false,
      hidden: true,
    },
  ],
}
