import type { CollectionConfig } from 'payload'

import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
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

import { accessByTenantOrReadPublished } from '@/access/byTenantOrReadPublished'
import { filterByTenant } from '@/access/filterByTenant'
import { BiographyBlock } from '@/blocks/Biography/config'
import { TeamBlock } from '@/blocks/Team/config'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { Tenant } from '@/payload-types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: accessByTenantOrReadPublished('pages'),
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
      url: async ({ data, req, payload }) => {
        let tenant = data.tenant

        if (typeof tenant === 'number') {
          tenant = await payload.findByID({
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
    // TODO: keep rendering for some preview endpoint with slug or you won't see a preview until this is in a section
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
                CallToAction,
                Content,
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
