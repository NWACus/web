import { accessByGlobalRoleOrTenantIds } from '@/collections/Tenants/access/byGlobalRoleOrTenantIds'
import { cachedPublicTenants } from '@/collections/Tenants/endpoints/cachedPublicTenants'
import {
  revalidateTenantsAfterChange,
  revalidateTenantsAfterDelete,
} from '@/collections/Tenants/hooks/revalidateTenants'
import {
  updateEdgeConfigAfterChange,
  updateEdgeConfigAfterDelete,
} from '@/collections/Tenants/hooks/updateEdgeConfig'
import { contentHashField } from '@/fields/contentHashField'
import type { CollectionConfig } from 'payload'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: accessByGlobalRoleOrTenantIds,
  admin: {
    useAsTitle: 'name',
    group: 'Permissions',
  },
  labels: {
    plural: 'Avalanche Centers',
    singular: 'Avalanche Center',
  },
  defaultPopulate: {
    slug: true,
    customDomain: true, // required for byGlobalRoleOrTenantRoleAssignment
  },
  endpoints: [
    {
      path: '/cached-public',
      method: 'get',
      handler: cachedPublicTenants,
    },
  ],
  hooks: {
    afterChange: [revalidateTenantsAfterChange, updateEdgeConfigAfterChange],
    afterDelete: [revalidateTenantsAfterDelete, updateEdgeConfigAfterDelete],
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
      type: 'text',
      admin: {
        description:
          'Used for subdomains and url paths for previews. This is a unique identifier for a tenant.',
        readOnly: true,
      },
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
