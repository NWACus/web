import { BlogListBlock } from '@/blocks/BlogList/config'
import { FormEmbedBlock } from '@/blocks/FormEmbed/config'
import { GenericEmbedBlock } from '@/blocks/GenericEmbed/config'
import { SingleBlogPostBlock } from '@/blocks/SingleBlogPost/config'
import { VideoEmbedBlock } from '@/blocks/VideoEmbed/config'
import { DEFAULT_INLINE_BLOCKS } from '@/constants/defaultInlineBlocks'
import { validateExternalUrl } from '@/utilities/validateUrl'
import {
  AlignFeature,
  BlocksFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'
import { Config } from 'payload'

import { LINK_ENABLED_COLLECTIONS } from '@/constants/linkCollections'
import { linkReferenceField } from '@/fields/linkField'

export const defaultLexical: Config['editor'] = lexicalEditor({
  features: () => {
    return [
      HeadingFeature({
        enabledHeadingSizes: ['h2', 'h3', 'h4'],
      }),
      ParagraphFeature(),
      UnderlineFeature(),
      BoldFeature(),
      ItalicFeature(),
      LinkFeature({
        enabledCollections: LINK_ENABLED_COLLECTIONS,
        fields: ({ defaultFields }) => {
          const defaultFieldsWithoutUrl = defaultFields
            .filter((field) => field.name !== 'url' && field.name !== 'doc')
            .map((field) =>
              field.name === 'linkType' && field.type === 'radio'
                ? {
                    ...field,
                    defaultValue: 'internal',
                    options: [
                      { label: 'Internal link', value: 'internal' },
                      { label: 'External link', value: 'custom' },
                    ],
                  }
                : field,
            )

          return [
            ...defaultFieldsWithoutUrl,
            linkReferenceField({
              name: 'doc',
              condition: (_, siblingData) => siblingData?.linkType === 'internal',
            }),
            {
              name: 'url',
              type: 'text',
              admin: {
                condition: (_data, siblingData) => siblingData?.linkType === 'custom',
              },
              label: ({ t }) => t('fields:enterURL'),
              required: true,
              validate: validateExternalUrl,
            },
          ]
        },
      }),
      BlocksFeature({
        blocks: [
          GenericEmbedBlock,
          FormEmbedBlock,
          VideoEmbedBlock,
          BlogListBlock,
          SingleBlogPostBlock,
        ],
        inlineBlocks: DEFAULT_INLINE_BLOCKS,
      }),
      FixedToolbarFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
      AlignFeature(),
    ]
  },
})
