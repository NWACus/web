import {
  MetaDescriptionField,
  MetaImageField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { type CollectionConfig } from 'payload'

import { byGlobalRole } from '@/access/byGlobalRole'
import { accessByGlobalRoleOrReadPublished } from '@/access/byGlobalRoleOrPublished'
import { GLOBAL_BLOCKS } from '@/constants/defaults'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { titleField } from '@/fields/title'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import { ruleMatches } from '@/utilities/rbac/ruleMatches'
import type { FieldAccess } from 'payload'
import { blocks } from 'payload/shared'
import { revalidateGlobalPage, revalidateGlobalPageDelete } from './hooks/revalidateGlobalPage'

// Super admins via global role, or tenant editors who can manage pages
const avyContentAccess: FieldAccess = (args) => {
  if (!args.req.user) return false
  if (byGlobalRole('update', 'globalPages')(args)) return true
  const assignments = roleAssignmentsForUser(args.req.payload.logger, args.req.user)
  return assignments.some(
    (a) =>
      a.role && typeof a.role !== 'number' && a.role.rules.some(ruleMatches('update', 'pages')),
  )
}

export const GlobalPages: CollectionConfig<'globalPages'> = {
  slug: 'globalPages',
  labels: {
    singular: 'Global Page',
    plural: 'Global Pages',
  },
  access: {
    ...accessByGlobalRoleOrReadPublished('globalPages'),
    // Also allow tenant editors who can manage pages to update (for avyContent)
    update: avyContentAccess,
  },
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
    {
      ...titleField({
        description:
          'The main heading for this global page. This page will be available across all avalanche center sites.',
      }),
      access: { update: byGlobalRole('update', 'globalPages') },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: GLOBAL_BLOCKS,
              required: true,
              access: { update: byGlobalRole('update', 'globalPages') },
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
              name: 'avyContent',
              type: 'array',
              access: {
                // Anyone who can read the global page can see avy content
                read: () => true,
                // Super admins via global role, or tenant editors who can manage pages
                create: avyContentAccess,
                update: avyContentAccess,
              },
              admin: {
                components: {
                  Field: '@/collections/GlobalPages/components/AvyContentField#AvyContentField',
                },
              },
              fields: [
                {
                  name: 'tenant',
                  type: 'relationship',
                  relationTo: 'tenants',
                  required: true,
                  label: 'Avalanche Center',
                  admin: {
                    allowCreate: false,
                    allowEdit: false,
                  },
                },
                {
                  name: 'layout',
                  type: 'blocks',
                  blocks: GLOBAL_BLOCKS,
                  required: true,
                  admin: {
                    description:
                      'Content blocks that appear below the global content for this center.',
                  },
                },
              ],
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
      access: { update: byGlobalRole('update', 'globalPages') },
      admin: {
        position: 'sidebar',
        description:
          "Set when this page was or should be published. This affects the page's visibility and can be used for scheduling future publications.",
      },
    },
    { ...slugField(), access: { update: byGlobalRole('update', 'globalPages') } },
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
