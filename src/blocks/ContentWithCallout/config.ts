import type { Block } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { ButtonsBlock } from '../Buttons/config'
import { GenericEmbedLexical } from '../GenericEmbed/config'

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
              blocks: [ButtonsBlock, GenericEmbedLexical],
            }),
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
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
            FixedToolbarFeature(),
            BlocksFeature({
              blocks: [ButtonsBlock, GenericEmbedLexical],
            }),
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          ]
        },
      }),
    },
  ],
}
