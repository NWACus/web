import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { navLink } from '@/fields/navLink'
import { tenantField } from '@/fields/tenantField'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionConfig } from 'payload'
import { topLevelNavTab } from './fields/topLevelNavTab'

export const Navigations: CollectionConfig = {
  slug: 'navigations',
  access: accessByTenant('navigations'),
  labels: {
    singular: 'Navigation',
    plural: 'Navigation',
  },
  admin: {
    // the GlobalViewRedirect will never allow a user to visit the list view of this collection but including this list filter as a precaution
    baseListFilter: filterByTenant,
    group: 'Globals',
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
          name: 'forecast',
          description: 'This nav dropdown is autofilled with your forecast zones.',
          isConfigurable: false,
        }),
        topLevelNavTab({
          name: 'observations',
          description: 'This nav dropdown is autofilled with the default observations links.',
          isConfigurable: false,
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
          isConfigurable: false,
        }),
        topLevelNavTab({
          name: 'events',
          description:
            'This nav item navigates to your events landing page and does not have any dropdown items.',
          isConfigurable: false,
        }),
        topLevelNavTab({ name: 'about' }),
        topLevelNavTab({ name: 'support' }),
        {
          name: 'donate',
          description: 'This nav item is styled as a button.',
          fields: [navLink],
        },
      ],
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
    maxPerDoc: 10,
  },
}
