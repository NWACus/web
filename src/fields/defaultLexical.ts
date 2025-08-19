import { BlogListBlockLexical } from '@/blocks/BlogList/config'
import {
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
        enabledCollections: ['pages', 'posts'],
        fields: ({ defaultFields }) => {
          const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
            if ('name' in field && field.name === 'url') return false
            return true
          })

          return [
            ...defaultFieldsWithoutUrl,
            {
              name: 'url',
              type: 'text',
              admin: {
                condition: ({ linkType }) => linkType !== 'internal',
              },
              label: ({ t }) => t('fields:enterURL'),
              required: true,
            },
          ]
        },
      }),
      BlocksFeature({
        blocks: [BlogListBlockLexical],
      }),
      FixedToolbarFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
    ]
  },
})
