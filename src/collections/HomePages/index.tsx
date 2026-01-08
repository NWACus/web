import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

import { ButtonBlock } from '@/blocks/Button/config'
import { GenericEmbedLexical } from '@/blocks/GenericEmbed/config'
import { MediaBlockLexical } from '@/blocks/MediaBlock/config'
import { SingleBlogPostBlockLexical } from '@/blocks/SingleBlogPost/config'
import { SponsorsBlock } from '@/blocks/SponsorsBlock/config'

import { DocumentBlock } from '@/blocks/DocumentBlock/config'
import { NACMediaBlock } from '@/blocks/NACMediaBlock/config'
import { DEFAULT_BLOCKS } from '@/constants/defaults'
import colorPickerField from '@/fields/color'
import { quickLinksField } from '@/fields/quickLinksFields'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { Tenant } from '@/payload-types'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { isTenantValue } from '@/utilities/isTenantValue'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { populateBlocksInHighlightedContent } from './hooks/populateBlocksInHighlightedContent'
import { revalidateHomePage, revalidateHomePageDelete } from './hooks/revalidateHomePage'

export const HomePages: CollectionConfig = {
  slug: 'homePages',
  access: accessByTenantRole('homePages'),
  labels: {
    singular: 'Home Page',
    plural: 'Home Page',
  },
  admin: {
    // the GlobalViewRedirect will never allow a user to visit the list view of this collection but including this list filter as a precaution
    baseListFilter: filterByTenant,
    group: 'Content',
    livePreview: {
      url: async ({ data, req }) => {
        let tenant: Partial<Tenant> | null = null

        if (isTenantValue(data.tenant)) {
          tenant = await resolveTenant(data.tenant)
        }

        return generatePreviewPath({
          slug: '',
          collection: 'pages',
          tenant,
          req,
        })
      },
    },
    preview: async (data, { req }) => {
      let tenant: Partial<Tenant> | null = null

      if (isTenantValue(data.tenant)) {
        tenant = await resolveTenant(data.tenant)
      }

      return generatePreviewPath({
        slug: '',
        collection: 'pages',
        tenant,
        req,
      })
    },
  },
  fields: [
    tenantField({ unique: true }),
    quickLinksField({
      description:
        'If quick links are added they will appear to the right of the home page map on desktop and below the home page map on mobile. These are optional.',
    }),
    {
      name: 'highlightedContent',
      type: 'group',
      admin: {
        description:
          'This section is displayed prominantly below the forecast zones map. Use this for important news or other highlighted content. You can hide this section without deleting the content by ensuring the "Show Highlighted Content" checkbox is deselected.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Show Highlighted Content',
          required: true,
          admin: {
            description: 'This controls whether or not this section is displayed.',
          },
        },
        {
          name: 'heading',
          type: 'text',
        },
        colorPickerField('Background color'),
        {
          name: 'columns',
          label: false,
          labels: {
            plural: 'Columns',
            singular: 'Column',
          },
          type: 'array',
          admin: {
            initCollapsed: false,
          },
          defaultValue: [
            {
              columns: [],
            },
          ],
          maxRows: 2,
          fields: [
            {
              name: 'richText',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    BlocksFeature({
                      blocks: [
                        ButtonBlock,
                        DocumentBlock,
                        GenericEmbedLexical,
                        MediaBlockLexical,
                        SingleBlogPostBlockLexical,
                        SponsorsBlock,
                      ],
                    }),
                    HorizontalRuleFeature(),
                    InlineToolbarFeature(),
                  ]
                },
              }),
              label: false,
            },
          ],
        },
      ],
    },
    {
      name: 'layout',
      admin: {
        description:
          'This is the body of your home page. This content will appear below the forecast zones map and the Highlighted Content section.',
        initCollapsed: false,
      },
      type: 'blocks',
      blocks: [...DEFAULT_BLOCKS, NACMediaBlock].sort((a, b) => a.slug.localeCompare(b.slug)),
      required: true,
      filterOptions: ({ data }) => {
        const layoutBlocks = data?.layout

        if (!layoutBlocks) return true

        const nacMediaBlockCount = layoutBlocks.filter(
          (block: { blockType: string }) => block.blockType === 'nacMediaBlock',
        ).length
        return nacMediaBlockCount > 1 ? DEFAULT_BLOCKS.map((block) => block.slug) : true
      },
    },
    {
      name: 'blocksInHighlightedContent',
      type: 'array',
      admin: {
        readOnly: true,
        disabled: true,
        description:
          'Automatically populated field tracking block references in highlightedContent for revalidation purposes.',
      },
      fields: [
        {
          name: 'blockType',
          type: 'text',
        },
        {
          name: 'collection',
          type: 'text',
        },
        {
          name: 'docId',
          type: 'number',
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    contentHashField(),
  ],
  hooks: {
    afterChange: [revalidateHomePage],
    beforeChange: [populateBlocksInHighlightedContent, populatePublishedAt],
    afterDelete: [revalidateHomePageDelete],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 10,
  },
}
