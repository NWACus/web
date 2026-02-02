import type { Block } from 'payload'

import colorPickerField from '@/fields/color'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { BlogListBlock } from '../BlogList/config'
import { ButtonBlock } from '../Button/config'
import { GenericEmbedBlock } from '../GenericEmbed/config'
import { MediaBlock } from '../Media/config'
import { SingleBlogPostBlock } from '../SingleBlogPost/config'

export const CalloutBlock: Block = {
  slug: 'calloutBlock',
  interfaceName: 'calloutBlock',
  imageURL: '/thumbnail/ContentCalloutThumbnail.jpg',
  fields: [
    colorPickerField('Background color'),
    {
      name: 'callout',
      type: 'richText',
      label: 'Callout',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            BlocksFeature({
              blocks: [
                BlogListBlock,
                ButtonBlock,
                GenericEmbedBlock,
                MediaBlock,
                SingleBlogPostBlock,
              ],
            }),
          ]
        },
      }),
    },
  ],
}
