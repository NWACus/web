import type { Block } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
  SubscriptFeature,
} from '@payloadcms/richtext-lexical'
import { ButtonBlock } from '../Button/config'

export const Membership: Block = {
  slug: 'membership',
  interfaceName: 'MembershipBlock',
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
              blocks: [ButtonBlock],
            }),
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            SubscriptFeature(),
          ]
        },
      }),
      label: false,
    },
  ],
  labels: {
    plural: 'Memberships',
    singular: 'Membership',
  },
}
