import { ButtonsBlock } from '@/blocks/Buttons/config'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { Field } from 'payload'

export const richText: Field = {
  name: 'richText',
  type: 'richText',
  editor: lexicalEditor({
    features: ({ rootFeatures }) => {
      return [
        ...rootFeatures,
        BlocksFeature({
          blocks: [ButtonsBlock],
        }),
        FixedToolbarFeature(),
        HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
        HorizontalRuleFeature(),
        InlineToolbarFeature(),
      ]
    },
  }),
  label: false,
}
