import { BlogListBlock } from '@/blocks/BlogList/config'
import { GenericEmbedBlock } from '@/blocks/GenericEmbed/config'
import { SingleBlogPostBlock } from '@/blocks/SingleBlogPost/config'
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
              validate: validateExternalUrl,
            },
          ]
        },
      }),
      BlocksFeature({
        blocks: [GenericEmbedBlock, BlogListBlock, SingleBlogPostBlock],
      }),
      FixedToolbarFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
      AlignFeature(),
    ]
  },
})
