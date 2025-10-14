import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { navLink } from '@/fields/navLink'
import { tenantField } from '@/fields/tenantField'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionConfig } from 'payload'
import { topLevelNavTab } from './fields/topLevelNavTab'
import { revalidateNavigation, revalidateNavigationDelete } from './hooks/revalidateNavigation'

export const Navigations: CollectionConfig = {
  slug: 'navigations',
  access: accessByTenantRole('navigations'),
  hooks: {
    afterChange: [revalidateNavigation],
    afterDelete: [revalidateNavigationDelete],
  },
  labels: {
    singular: 'Navigation',
    plural: 'Navigation',
  },
  admin: {
    // the GlobalViewRedirect will never allow a user to visit the list view of this collection but including this list filter as a precaution
    baseListFilter: filterByTenant,
    group: 'Settings',
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
  },
  fields: [
    tenantField({ unique: true }),
    {
      type: 'tabs',
      tabs: [
        topLevelNavTab({
          name: 'forecasts',
          description: 'This nav dropdown is autofilled with your forecast zones.',
          hasConfigurableNavItems: false,
          hasEnabledToggle: false,
        }),
        topLevelNavTab({
          name: 'observations',
          description: 'This nav dropdown is autofilled with the default observations links.',
          hasConfigurableNavItems: false,
          hasEnabledToggle: false,
        }),
        topLevelNavTab({
          name: 'weather',
          description: 'This nav dropdown will also include your weather stations.',
        }),
        topLevelNavTab({ name: 'education' }),
        topLevelNavTab({ name: 'accidents' }),
        topLevelNavTab({
          name: 'blog',
          description:
            'This nav item navigates to your blog landing page and does not have any dropdown items.',
          hasConfigurableNavItems: false,
          enabledToggleDescription:
            'If hidden from the nav, the blog landing page will still be accessible to visitors for filtered blog lists.',
        }),
        topLevelNavTab({
          name: 'events',
          description:
            'This nav item navigates to your events landing page and does not have any dropdown items.',
          hasConfigurableNavItems: false,
          enabledToggleDescription:
            'If hidden from the nav, the events landing page will still be accessible to visitors for filtered event lists.',
        }),
        topLevelNavTab({ name: 'about' }),
        topLevelNavTab({ name: 'support' }),
        {
          name: 'donate',
          description: 'This nav item is styled as a button.',
          fields: [
            {
              type: 'group',
              name: 'options',
              fields: [
                {
                  type: 'checkbox',
                  defaultValue: true,
                  name: 'enabled',
                },
              ],
            },
            navLink,
          ],
        },
      ],
    },
    contentHashField(),
  ],
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 10,
  },
}
