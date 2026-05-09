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
      name: 'layout',
      type: 'select',
      defaultValue: 'download',
      options: [
        { label: 'Download Link', value: 'download' },
        { label: 'Embed (iframe)', value: 'embed' },
      ],
    },
  ],
}
