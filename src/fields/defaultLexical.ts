import { BlogListLexicalBlock } from '@/blocks/BlogList/config'
import { GenericEmbedLexicalBlock } from '@/blocks/GenericEmbed/config'
import { SingleBlogPostLexicalBlock } from '@/blocks/SingleBlogPost/config'
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
        enabledCollections: ['pages', 'posts', 'builtInPages'],
        fields: ({ defaultFields }) => {
          const defaultFieldsWithoutUrl = defaultFields.filter((field) => field.name !== 'url')

          return [
            ...defaultFieldsWithoutUrl,
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
        blocks: [GenericEmbedLexicalBlock, BlogListLexicalBlock, SingleBlogPostLexicalBlock],
      }),
      FixedToolbarFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
      AlignFeature(),
    ]
  },
})
