import { accessByGlobalRoleOrTenantIds } from '@/collections/Tenants/access/byGlobalRoleOrTenantIds'
import { provisionTenant } from '@/collections/Tenants/endpoints/provisionTenant'
import { deprovisionBeforeDelete } from '@/collections/Tenants/hooks/deprovisionBeforeDelete'
import {
  revalidateTenantsAfterChange,
  revalidateTenantsAfterDelete,
} from '@/collections/Tenants/hooks/revalidateTenants'
import { contentHashField } from '@/fields/contentHashField'
import { hasReadOnlyAccess } from '@/utilities/rbac/hasReadOnlyAccess'
import { AVALANCHE_CENTERS, VALID_TENANT_SLUGS } from '@/utilities/tenancy/avalancheCenters'
import type { CollectionConfig } from 'payload'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: accessByGlobalRoleOrTenantIds,
  admin: {
    useAsTitle: 'name',
    group: 'Permissions',
    hidden: ({ user }) => hasReadOnlyAccess(user, 'tenants'),
    components: {
      edit: {
        beforeDocumentControls: [
          '@/collections/Tenants/components/SyncTenantsOnSave#SyncTenantsOnSave',
          '@/collections/Tenants/components/DeleteTenantModal#DeleteTenantModal',
          '@/collections/Tenants/components/AutoFillNameFromSlug#AutoFillNameFromSlug',
        ],
      },
    },
  },
  labels: {
    plural: 'Avalanche Centers',
    singular: 'Avalanche Center',
  },
  // update src/utilities/isTenantValue.ts if this changes
  defaultPopulate: {
    slug: true,
  },
  endpoints: [
    {
      path: '/provision',
      method: 'post',
      handler: provisionTenant,
    },
  ],
  hooks: {
    afterChange: [revalidateTenantsAfterChange],
    beforeDelete: [deprovisionBeforeDelete],
    afterDelete: [revalidateTenantsAfterDelete],
  },
  fields: [
    {
      name: 'slug',
      type: 'select',
      admin: {
        components: {
          Cell: '@/collections/Tenants/components/TenantSlugCell#TenantSlugCell',
          Field: '@/collections/Tenants/components/TenantSlugField#TenantSlugField',
        },
        description: 'Avalanche center identifier. Used for subdomains and URL paths.',
      },
      options: VALID_TENANT_SLUGS.map((slug) => ({
        label: `${slug} — ${AVALANCHE_CENTERS[slug].name}`,
        value: slug,
      })),
      index: true,
      required: true,
      unique: true,
      access: {
        update: () => false, // we should never change this after initial creation
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    contentHashField(),
    {
      name: 'provisioning',
      type: 'group',
      label: 'Provisioning',
      admin: {
        hidden: true,
      },
      fields: [
        {
          name: 'status',
          type: 'select',
          defaultValue: 'not_started',
          required: true,
          options: [
            { label: 'Not started', value: 'not_started' },
            { label: 'In progress', value: 'in_progress' },
            { label: 'Complete', value: 'complete' },
            { label: 'Partial', value: 'partial' },
            { label: 'Complete — manual actions remaining', value: 'manual' },
          ],
        },
        { name: 'lastRunAt', type: 'date' },
        {
          name: 'failed',
          type: 'json',
          admin: {
            description:
              'What failed during the last provisioning run. Empty when everything succeeded.',
          },
          jsonSchema: {
            uri: 'a://b/tenant-provisioning-failed.json',
            fileMatch: ['a://b/tenant-provisioning-failed.json'],
            // Presence of a key means that step failed; the value is the
            // error message (stored for debugging, not shown in admin UI).
            // `pages` is page-name → error message.
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                pages: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                },
                homePage: { type: 'string' },
                navigation: { type: 'string' },
                websiteSettings: { type: 'string' },
                // Set synthetically on read when an in_progress run has gone
                // past the staleness window — see checkProvisioningStatusAction.
                timedOut: { type: 'string' },
              },
            },
          },
        },
      ],
    },
    {
      type: 'ui',
      name: 'onboardingChecklist',
      label: 'Onboarding Status',
      admin: {
        components: {
          Cell: '@/collections/Tenants/components/OnboardingStatusCell#OnboardingStatusCell',
          Field: '@/collections/Tenants/components/OnboardingChecklist#OnboardingChecklist',
        },
        position: 'sidebar',
      },
    },
  ],
}
