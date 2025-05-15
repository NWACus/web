import type { Block } from 'payload'

import { richText } from '@/fields/richText'
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
    richText,
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
              blocks: [ButtonsBlock],
            }),
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          ]
        },
      }),
    },
  ],
}
