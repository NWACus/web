import type { CollectionConfig } from 'payload'

import { BiographyBlock } from '@/blocks/Biography/config'
import { Content } from '@/blocks/Content/config'
import { ContentWithCallout } from '@/blocks/ContentWithCallout/config'
import { FormBlock } from '@/blocks/Form/config'
import { ImageLinkGrid } from '@/blocks/ImageLinkGrid/config'
import { ImageQuote } from '@/blocks/ImageQuote/config'
import { ImageText } from '@/blocks/ImageText/config'
import { ImageTextList } from '@/blocks/ImageTextList/config'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import { accessByTenantRoleOrReadPublished } from '@/access/byTenantRoleOrReadPublished'
import { filterByTenant } from '@/access/filterByTenant'
import { TeamBlock } from '@/blocks/Team/config'

import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

import { duplicatePageToTenant } from '@/collections/Pages/endpoints/duplicatePageToTenant'
import { Tenant } from '@/payload-types'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: accessByTenantRoleOrReadPublished('pages'),
  defaultPopulate: {
    title: true,
    slug: true,
    meta: true,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    baseListFilter: filterByTenant,
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
          slug: typeof data?.slug === 'string' ? data.slug : '',
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
        slug: typeof data.slug === 'string' ? data.slug : '',
        collection: 'pages',
        tenant,
        req,
      })
    },
    useAsTitle: 'title',
    components: {
      edit: {
        editMenuItems: ['@/collections/Pages/components/DuplicatePageFor#DuplicatePageFor'],
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
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
                Content,
                ContentWithCallout,
                FormBlock,
                ImageLinkGrid,
                ImageQuote,
                ImageText,
                ImageTextList,
                LinkPreviewBlock,
                MediaBlock,
                TeamBlock,
              ],
              required: true,
              admin: {
                initCollapsed: true,
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
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
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
      },
    },
    ...slugField(),
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
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
    },
    maxPerDoc: 50,
  },
}
