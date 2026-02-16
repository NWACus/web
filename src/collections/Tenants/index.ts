import { accessByGlobalRoleOrTenantIds } from '@/collections/Tenants/access/byGlobalRoleOrTenantIds'
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
  },
  labels: {
    plural: 'Avalanche Centers',
    singular: 'Avalanche Center',
  },
  // update src/utilities/isTenantValue.ts if this changes
  defaultPopulate: {
    slug: true,
    customDomain: true, // required for byGlobalRoleOrTenantRoleAssignment
  },
  hooks: {
    afterChange: [revalidateTenantsAfterChange],
    afterDelete: [revalidateTenantsAfterDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'customDomain',
      type: 'text',
      label: 'Custom Domain',
    },
    {
      name: 'slug',
      type: 'select',
      admin: {
        description: 'Avalanche center identifier. Used for subdomains and URL paths.',
      },
      options: VALID_TENANT_SLUGS.map((slug) => ({
        label: `${AVALANCHE_CENTERS[slug].name} (${slug})`,
        value: slug,
      })),
      index: true,
      required: true,
      unique: true,
      access: {
        update: () => false, // we should never change this after initial creation
      },
    },
    contentHashField(),
  ],
}
