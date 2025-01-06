import type { CollectionConfig } from 'payload'

import { externalUsersLogin } from './endpoints/externalUsersLogin'
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain'
import { accessByGlobalRoleOrTenantDomain } from '@/collections/Users/access/byGlobalRoleOrTenantDomain'

export const Users: CollectionConfig = {
  slug: 'users',
  access: accessByGlobalRoleOrTenantDomain,
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  endpoints: [externalUsersLogin],
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
      access: {
        read: () => true,
      },
      collection: 'globalRoleAssignments',
      on: 'user',
      saveToJWT: true,
      maxDepth: 2,
    },
    {
      name: 'roles',
      type: 'join',
      access: {
        read: () => true,
      },
      collection: 'roleAssignments',
      on: 'user',
      saveToJWT: true,
      maxDepth: 3,
    },
    // TODO: maybe add a set of associated tenants here or something to allow tenant admins to see you
  ],
  hooks: {
    afterLogin: [setCookieBasedOnDomain],
  },
}
