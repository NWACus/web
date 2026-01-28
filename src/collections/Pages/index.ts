import {
  MetaDescriptionField,
  MetaImageField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import type { CollectionConfig } from 'payload'

import { accessByTenantRoleOrReadPublished } from '@/access/byTenantRoleOrReadPublished'
import { filterByTenant } from '@/access/filterByTenant'

import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'

import { duplicatePageToTenant } from '@/collections/Pages/endpoints/duplicatePageToTenant'

import { NACMediaBlock } from '@/blocks/NACMedia/config'
import { DEFAULT_BLOCKS } from '@/constants/defaults'
import { titleField } from '@/fields/title'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { blocks } from 'payload/shared'
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
    preview: async (data, { req }) =>
      generatePreviewPath({
        slug: typeof data.slug === 'string' ? data.slug : '',
        collection: 'pages',
        tenant: data.tenant,
        req,
      }),
    useAsTitle: 'title',
    components: {
      edit: {
        beforeDocumentControls: ['@/collections/Pages/components/ViewPageButton#ViewPageButton'],
        editMenuItems: ['@/collections/Pages/components/DuplicatePageFor#DuplicatePageFor'],
      },
    },
  },
  fields: [
    titleField({
      description:
        'The main heading for this page. This appears in the browser tab, search results, and as the page heading. Keep it descriptive and under 60 characters for best SEO results.',
    }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [...DEFAULT_BLOCKS, NACMediaBlock].sort((a, b) =>
                a.slug.localeCompare(b.slug),
              ),
              required: true,
              admin: {
                initCollapsed: false,
                description:
                  'This is where you design your page. Add and move blocks around to change the layout. Use the Preview button to see your page edits in another tab.',
              },
              filterOptions: ({ data }) => {
                const layoutBlocks = data?.layout

                if (!layoutBlocks) return true

                const nacMediaBlockCount = layoutBlocks.filter(
                  (block: { blockType: string }) => block.blockType === 'nacMediaBlock',
                ).length
                return nacMediaBlockCount >= 1 ? DEFAULT_BLOCKS.map((block) => block.slug) : true
              },
              validate: (value, args) => {
                if (!value || !Array.isArray(value)) return blocks(value, args)

                const nacMediaBlockCount = value.filter(
                  (block) => block.blockType === 'nacMediaBlock',
                ).length

                if (nacMediaBlockCount > 1) {
                  throw Error('Only one NACMediaBlock is allowed per page')
                }

                return blocks(value, args)
              },
            },
          ],
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
      path: '/duplicate-to-tenant/:tenantSlug',
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
    drafts: true,
    maxPerDoc: 50,
  },
}
