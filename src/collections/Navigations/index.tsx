import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionConfig } from 'payload'
import { navTab } from './fields/navTab'
import { clearUnusedTabData } from './hooks/clearUnusedTabData'
import { revalidateNavigation, revalidateNavigationDelete } from './hooks/revalidateNavigation'

export const Navigations: CollectionConfig = {
  slug: 'navigations',
  access: accessByTenantRole('navigations'),
  hooks: {
    beforeChange: [clearUnusedTabData],
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
    preview: async (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === 'string' ? data.slug : '',
        collection: 'navigations',
        tenant: data.tenant,
        req,
      }),
  },
  fields: [
    tenantField({ unique: true }),
    {
      type: 'tabs',
      tabs: [
        navTab({
          name: 'forecasts',
          hasEnabledToggle: false,
        }),
        navTab({
          name: 'observations',
          hasEnabledToggle: false,
        }),
        navTab({
          name: 'weather',
        }),
        navTab({
          name: 'education',
        }),
        navTab({
          name: 'accidents',
        }),
        navTab({
          name: 'blog',
          description: 'Points to your blog landing page',
          defaultMode: 'link',
          enabledToggleDescription:
            'If hidden from the nav, the blog landing page will still be accessible to visitors for filtered blog lists.',
        }),
        navTab({
          name: 'events',
          description: 'Points to your events landing page',
          defaultMode: 'link',
          enabledToggleDescription:
            'If hidden from the nav, the events landing page will still be accessible to visitors for filtered event lists.',
        }),
        navTab({
          name: 'about',
        }),
        navTab({
          name: 'support',
        }),
        navTab({
          name: 'donate',
          defaultMode: 'button',
          enabledToggleDescription: 'If hidden, the button will not appear in the nav.',
        }),
      ],
    },
    contentHashField(),
  ],
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
}
