import { Tenant } from '@/payload-types'
import {
  MetaDescriptionField,
  MetaImageField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import type { CollectionConfig } from 'payload'

import { BiographyBlock } from '@/blocks/Biography/config'
import { BlogListBlock } from '@/blocks/BlogList/config'
import { Content } from '@/blocks/Content/config'
import { DocumentBlock } from '@/blocks/DocumentBlock/config'
import { EventListBlock } from '@/blocks/EventList/config'
import { EventTableBlock } from '@/blocks/EventTable/config'
import { FormBlock } from '@/blocks/Form/config'
import { GenericEmbed } from '@/blocks/GenericEmbed/config'
import { HeaderBlock } from '@/blocks/Header/config'
import { ImageLinkGrid } from '@/blocks/ImageLinkGrid/config'
import { ImageQuote } from '@/blocks/ImageQuote/config'
import { ImageText } from '@/blocks/ImageText/config'
import { ImageTextList } from '@/blocks/ImageTextList/config'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { SingleBlogPostBlock } from '@/blocks/SingleBlogPost/config'
import { SingleEventBlock } from '@/blocks/SingleEvent/config'
import { SponsorsBlock } from '@/blocks/SponsorsBlock/config'
import { TeamBlock } from '@/blocks/Team/config'

import { accessByTenantRoleOrReadPublished } from '@/access/byTenantRoleOrReadPublished'
import { filterByTenant } from '@/access/filterByTenant'

import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'

import { duplicatePageToTenant } from '@/collections/Pages/endpoints/duplicatePageToTenant'

import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { isTenantValue } from '@/utilities/isTenantValue'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { revalidatePage, revalidatePageDelete } from './hooks/revalidatePage'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: accessByTenantRoleOrReadPublished('pages'),
  defaultPopulate: {
    title: true,
    slug: true,
    meta: true,
    _status: true,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    baseListFilter: filterByTenant,
    livePreview: {
      url: async ({ data, req }) => {
        let tenant: Partial<Tenant> | null = null

        if (isTenantValue(data.tenant)) {
          tenant = await resolveTenant(data.tenant)
        }

        return generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
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
        slug: typeof data.slug === 'string' ? data.slug : '',
        collection: 'pages',
        tenant,
        req,
      })
    },
    useAsTitle: 'title',
    components: {
      edit: {
        beforeDocumentControls: ['@/collections/Pages/components/ViewPageButton#ViewPageButton'],
        editMenuItems: ['@/collections/Pages/components/DuplicatePageFor#DuplicatePageFor'],
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description:
          'The main heading for this page. This appears in the browser tab, search results, and as the page heading. Keep it descriptive and under 60 characters for best SEO results.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                BiographyBlock,
                BlogListBlock,
                SingleBlogPostBlock,
                Content,
                DocumentBlock,
                EventListBlock,
                EventTableBlock,
                SingleEventBlock,
                FormBlock,
                HeaderBlock,
                GenericEmbed,
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
              admin: {
                initCollapsed: false,
                description:
                  'This is where you design your page. Add and move blocks around to change the layout. Use the Preview button to see your page edits in another tab or try the Live Preview to see changes in real time.',
              },
            },
          ],
          label: 'Content',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description:
          "Set when this page was or should be published. This affects the page's visibility and can be used for scheduling future publications.",
      },
    },
    slugField(),
    tenantField(),
    contentHashField(),
  ],
  endpoints: [
    {
      path: '/duplicate-to-tenant/:selectedTenantId',
      method: 'post',

      handler: async (req) => {
        const res = await duplicatePageToTenant(req)
        return Response.json({
          res,
        })
      },
    },
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidatePageDelete],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
}
