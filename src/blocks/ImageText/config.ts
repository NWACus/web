import type { Block } from 'payload'

import colorPickerField from '@/fields/color'
import { getImageTypeFilter } from '@/utilities/collectionFilters'
import { InlineToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const ImageTextBlock: Block = {
  slug: 'imageText',
  interfaceName: 'ImageTextBlock',
  imageURL: '/thumbnail/ImageTextThumbnail.jpg',
  fields: [
    colorPickerField('Background color'),
    {
      name: 'imageLayout',
      label: 'Which side should the image be on?',
      type: 'radio',
      options: [
        {
          label: 'Image left, text right',
          value: 'left',
        },
        {
          label: 'Text left, Image right',
          value: 'right',
        },
      ],
      defaultValue: 'left',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: getImageTypeFilter,
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, InlineToolbarFeature()]
        },
      }),
      label: false,
      required: true,
    },
  ],
}
