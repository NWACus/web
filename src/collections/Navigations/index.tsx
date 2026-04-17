import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionConfig } from 'payload'
import { navTab } from './fields/navTab'
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
        navTab({
          name: 'forecasts',
          description:
            'Autofilled from your forecast zones in the AFP. Edits here may be overwritten when zones change in the AFP.',
          hasEnabledToggle: false,
        }),
        navTab({
          name: 'observations',
          description:
            'Autofilled with default observation links (Recent Observations, Submit Observation). Edits here may be overwritten.',
          hasEnabledToggle: false,
        }),
        navTab({
          name: 'weather',
          description:
            'Your weather stations map is automatically included in this dropdown. Add any additional weather-related links below.',
        }),
        navTab({
          name: 'education',
          description:
            'Customize this dropdown with links to your education pages — e.g., classes, courses, workshops, scholarships.',
        }),
        navTab({
          name: 'accidents',
          description:
            'Customize this dropdown with links to accident reports, statistics, and related resources.',
        }),
        navTab({
          name: 'blog',
          description:
            'Points to your blog landing page (posts are listed automatically on that page).',
          defaultMode: 'link',
          enabledToggleDescription:
            'If hidden from the nav, the blog landing page will still be accessible to visitors for filtered blog lists.',
        }),
        navTab({
          name: 'events',
          description:
            'Points to your events landing page (upcoming events are listed automatically on that page).',
          defaultMode: 'link',
          enabledToggleDescription:
            'If hidden from the nav, the events landing page will still be accessible to visitors for filtered event lists.',
        }),
        navTab({
          name: 'about',
          description:
            'Customize this dropdown with "About Us" pages — e.g., team, mission, partners, annual reports.',
        }),
        navTab({
          name: 'support',
          description:
            'Customize this dropdown with ways supporters can contribute — e.g., donate, volunteer, corporate sponsorship.',
        }),
        navTab({
          name: 'donate',
          description:
            'Renders as a call-to-action button at the end of the navigation. Usually points to your donation page.',
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
