import { BlogListLexicalBlock } from '@/blocks/BlogList/config'
import { GenericEmbedLexicalBlock } from '@/blocks/GenericEmbed/config'
import { SingleBlogPostLexicalBlock } from '@/blocks/SingleBlogPost/config'
import { getTenantFilter } from '@/utilities/collectionFilters'
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
          const defaultFieldsWithoutUrl = defaultFields.filter(
            (field) => field.name !== 'url' && field.name !== 'doc',
          )

          return [
            ...defaultFieldsWithoutUrl,
            {
              name: 'doc',
              type: 'relationship',
              admin: {
                condition: (_, siblingData) => siblingData?.linkType === 'internal',
                width: '50%',
              },
              label: 'Select page or post',
              relationTo: LINK_ENABLED_COLLECTIONS,
              required: true,
              filterOptions: getTenantFilter,
            },
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
