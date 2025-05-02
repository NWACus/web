import type { Block } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
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
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            BlocksFeature({
              blocks: [ButtonBlock],
            }),
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
