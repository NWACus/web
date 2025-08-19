import type { Block } from 'payload'

import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { BlogListBlockLexical } from '../BlogList/config'
import { ButtonsBlock } from '../Buttons/config'
import { SingleBlogPostBlockLexical } from '../SingleBlogPost/config'

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
              blocks: [ButtonsBlock, BlogListBlockLexical, SingleBlogPostBlockLexical],
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
              blocks: [ButtonsBlock, BlogListBlockLexical, SingleBlogPostBlockLexical],
            }),
          ]
        },
      }),
    },
  ],
}
