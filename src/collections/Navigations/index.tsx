import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionConfig } from 'payload'
import { singleLinkNavTab } from './fields/singleLinkNavTab'
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
        topLevelNavTab({
          name: 'forecasts',
          description: 'This nav dropdown is autofilled with your forecast zones.',
          hasEnabledToggle: false,
        }),
        topLevelNavTab({
          name: 'observations',
          description: 'This nav dropdown is autofilled with the default observations links.',
          hasEnabledToggle: false,
        }),
        topLevelNavTab({
          name: 'weather',
          description: 'This nav dropdown will also include your weather stations.',
        }),
        topLevelNavTab({ name: 'education' }),
        topLevelNavTab({ name: 'accidents' }),
        singleLinkNavTab({
          name: 'blog',
          description:
            'This nav item navigates to your blog landing page and does not have any dropdown items.',
          enabledToggleDescription:
            'If hidden from the nav, the blog landing page will still be accessible to visitors for filtered blog lists.',
        }),
        singleLinkNavTab({
          name: 'events',
          description:
            'This nav item navigates to your events landing page and does not have any dropdown items.',
          enabledToggleDescription:
            'If hidden from the nav, the events landing page will still be accessible to visitors for filtered event lists.',
        }),
        topLevelNavTab({ name: 'about' }),
        topLevelNavTab({ name: 'support' }),
        singleLinkNavTab({
          name: 'donate',
          description: 'This link appears as a button in the navigation.',
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
