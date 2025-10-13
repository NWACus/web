import type { Block } from 'payload'

import colorPickerField from '@/fields/color'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { BlogListBlockLexical } from '../BlogList/config'
import { ButtonBlock } from '../Button/config'
import { GenericEmbedLexical } from '../GenericEmbed/config'
import { MediaBlockLexical } from '../MediaBlock/config'
import { SingleBlogPostBlockLexical } from '../SingleBlogPost/config'

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
                BlogListBlockLexical,
                ButtonBlock,
                GenericEmbedLexical,
                MediaBlockLexical,
                SingleBlogPostBlockLexical,
              ],
            }),
          ]
        },
      }),
    },
  ],
}
