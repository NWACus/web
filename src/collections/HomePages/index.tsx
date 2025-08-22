import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

import { BiographyBlock } from '@/blocks/Biography/config'
import { ButtonsBlock } from '@/blocks/Buttons/config'
import { Content } from '@/blocks/Content/config'
import { ContentWithCallout } from '@/blocks/ContentWithCallout/config'
import { FormBlock } from '@/blocks/Form/config'
import { GenericEmbedLexical } from '@/blocks/GenericEmbed/config'
import { ImageLinkGrid } from '@/blocks/ImageLinkGrid/config'
import { ImageQuote } from '@/blocks/ImageQuote/config'
import { ImageText } from '@/blocks/ImageText/config'
import { ImageTextList } from '@/blocks/ImageTextList/config'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { SingleBlogPostBlockLexical } from '@/blocks/SingleBlogPost/config'
import { SponsorsBlock } from '@/blocks/SponsorsBlock/config'
import { TeamBlock } from '@/blocks/Team/config'

import colorPickerField from '@/fields/color'
import { quickLinksField } from '@/fields/quickLinksFields'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { Tenant } from '@/payload-types'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import {
  BlocksFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
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
    group: 'Built-in Page Configs',
    livePreview: {
      url: async ({ data, req }) => {
        let tenant = data.tenant

        if (typeof tenant === 'number') {
          tenant = await req.payload.findByID({
            collection: 'tenants',
            id: tenant,
            depth: 2,
          })
        }

        const path = generatePreviewPath({
          slug: '',
          collection: 'pages',
          tenant,
          req,
        })

        return path
      },
    },
    preview: (data, { req }) => {
      const tenant =
        data.tenant &&
        typeof data.tenant === 'object' &&
        'id' in data.tenant &&
        'slug' in data.tenant
          ? (data.tenant as Tenant)
          : null
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
                        ButtonsBlock,
                        GenericEmbedLexical,
                        MediaBlock,
                        SingleBlogPostBlockLexical,
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
      },
      type: 'blocks',
      blocks: [
        BiographyBlock,
        Content,
        ContentWithCallout,
        FormBlock,
        ImageLinkGrid,
        ImageQuote,
        ImageText,
        ImageTextList,
        LinkPreviewBlock,
        MediaBlock,
        SponsorsBlock,
        TeamBlock,
      ],
      required: true,
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
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateHomePageDelete],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 10,
  },
}
