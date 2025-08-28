import type { Block } from 'payload'

import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { BlogListBlockLexical } from '../BlogList/config'
import { ButtonsBlock } from '../Buttons/config'
import { GenericEmbedLexical } from '../GenericEmbed/config'
import { MediaBlock } from '../MediaBlock/config'
import { SingleBlogPostBlockLexical } from '../SingleBlogPost/config'
import { SponsorsBlockLexical } from '../SponsorsBlock/config'

export const ContentWithCallout: Block = {
  slug: 'contentWithCallout',
  interfaceName: 'ContentWithCalloutBlock',
  imageURL: '/thumbnail/ContentCalloutThumbnail.jpg',
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            FixedToolbarFeature(),
            BlocksFeature({
              blocks: [
                BlogListBlockLexical,
                ButtonsBlock,
                GenericEmbedLexical,
                MediaBlock,
                SingleBlogPostBlockLexical,
                SponsorsBlockLexical,
              ],
            }),
          ]
        },
      }),
      label: false,
    },
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
                ButtonsBlock,
                GenericEmbedLexical,
                MediaBlock,
                SingleBlogPostBlockLexical,
              ],
            }),
          ]
        },
      }),
    },
  ],
}
