import {
  MetaDescriptionField,
  MetaImageField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import type { CollectionConfig } from 'payload'

import { accessByGlobalRoleOrReadPublished } from '@/access/byGlobalRoleOrPublished'
import { DEFAULT_BLOCKS } from '@/constants/defaults'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { titleField } from '@/fields/title'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { blocks } from 'payload/shared'
import { revalidateGlobalPage, revalidateGlobalPageDelete } from './hooks/revalidateGlobalPage'

export const GlobalPages: CollectionConfig<'globalPages'> = {
  slug: 'globalPages',
  labels: {
    singular: 'Global Page',
    plural: 'Global Pages',
  },
  access: accessByGlobalRoleOrReadPublished('globalPages'),
  defaultPopulate: {
    title: true,
    slug: true,
    meta: true,
    _status: true,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    titleField({
      description:
        'The main heading for this global page. This page will be available across all avalanche center sites.',
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
              blocks: [...DEFAULT_BLOCKS].sort((a, b) => a.slug.localeCompare(b.slug)),
              required: true,
              admin: {
                initCollapsed: false,
                description:
                  'This is where you design your page. Add and move blocks around to change the layout. Use the Preview button to see your page edits in another tab.',
              },
              validate: (value, args) => {
                if (!value || !Array.isArray(value)) return blocks(value, args)
                return blocks(value, args)
              },
            },
          ],
        },
        {
          label: 'Avy Content',
          description:
            "Add center-specific content that appears below the global content on this center's site.",
          fields: [
            {
              name: 'avyContentTenant',
              type: 'relationship',
              relationTo: 'tenants',
              required: false,
              label: 'Avalanche Center',
              admin: {
                description: 'Select which avalanche center this local content is for.',
              },
            },
            {
              name: 'avyContentLayout',
              label: 'Layout',
              type: 'blocks',
              blocks: [...DEFAULT_BLOCKS].sort((a, b) => a.slug.localeCompare(b.slug)),
              admin: {
                description:
                  'Content blocks that appear below the global content for the selected center.',
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
              hasGenerateFn: true,
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
    contentHashField(),
  ],
  hooks: {
    afterChange: [revalidateGlobalPage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateGlobalPageDelete],
  },
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
}
