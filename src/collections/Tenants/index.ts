import { accessByGlobalRoleOrTenantIds } from '@/collections/Tenants/access/byGlobalRoleOrTenantIds'
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
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    contentHashField(),
  ],
}
