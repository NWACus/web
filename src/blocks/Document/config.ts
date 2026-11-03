import type { Block } from 'payload'
import { validateDisplayAs } from './validateDisplayAs'

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
      name: 'displayAs',
      type: 'select',
      defaultValue: 'download',
      required: true,
      validate: validateDisplayAs,
      admin: {
        description: 'Only PDFs can be embedded. Use Download Link for other file types.',
      },
      options: [
        { label: 'Download Link', value: 'download' },
        { label: 'Embed (iframe)', value: 'embed' },
      ],
    },
  ],
}
