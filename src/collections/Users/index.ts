import type { CollectionConfig } from 'payload'

import { accessByGlobalRoleOrTenantDomain } from '@/collections/Users/access/byGlobalRoleOrTenantDomain'
import { contentHashField } from '@/fields/contentHashField'
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain'

export const Users: CollectionConfig = {
  slug: 'users',
  access: accessByGlobalRoleOrTenantDomain,
  admin: {
    useAsTitle: 'email',
    group: 'Permissions',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      index: true,
      required: true,
      saveToJWT: true,
    },
    {
      name: 'globalRoles',
      type: 'join',
      collection: 'globalRoleAssignments',
      on: 'user',
      saveToJWT: true,
      maxDepth: 2,
    },
    {
      name: 'roles',
      type: 'join',
      collection: 'roleAssignments',
      on: 'user',
      saveToJWT: true,
      maxDepth: 3,
    },
    contentHashField(),
    // TODO: maybe add a set of associated tenants here or something to allow tenant admins to see you
  ],
  hooks: {
    afterLogin: [setCookieBasedOnDomain],
  },
}
