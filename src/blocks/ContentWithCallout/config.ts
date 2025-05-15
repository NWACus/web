import type { Block } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { ButtonsBlock } from '../Buttons/config'

export const ContentWithCallout: Block = {
  slug: 'contentWithCallout',
  interfaceName: 'ContentWithCalloutBlock',
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
              blocks: [ButtonsBlock],
            }),
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          ]
        },
      }),
      label: false,
    },
    {
      name: 'enableCallout',
      type: 'checkbox',
    },
    {
      name: 'callout',
      type: 'richText',
      label: 'Callout',
      admin: {
        condition: (_, siblingData) => siblingData.enableCallout,
      },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            FixedToolbarFeature(),
            BlocksFeature({
              blocks: [ButtonsBlock],
            }),
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          ]
        },
      }),
    },
  ],
}
