import { BlogListLexicalBlock } from '@/blocks/BlogList/config'
import { GenericEmbedLexical } from '@/blocks/GenericEmbed/config'
import { SingleBlogPostLexicalBlock } from '@/blocks/SingleBlogPost/config'
import {
  AlignFeature,
  BlocksFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  LinkFields,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'
import { Config, TextFieldSingleValidation } from 'payload'

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
                condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
              },
              label: ({ t }) => t('fields:enterURL'),
              required: true,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              validate: ((value, options) => {
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                if ((options?.siblingData as LinkFields)?.linkType === 'internal') {
                  return true // no validation needed, as no url should exist for internal links
                }
                return value ? true : 'URL is required'
              }) as TextFieldSingleValidation,
            },
          ]
        },
      }),
      BlocksFeature({
        blocks: [GenericEmbedLexical, BlogListLexicalBlock, SingleBlogPostLexicalBlock],
      }),
      FixedToolbarFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
      AlignFeature(),
    ]
  },
})
