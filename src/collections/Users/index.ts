import type { CollectionConfig } from 'payload'

import { contentHashField } from '@/fields/contentHashField'
import { accessByGlobalRoleOrTenantRoleAssignmentOrDomain } from './access/byGlobalRoleOrTenantRoleAssignmentOrDomain'
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain'

export const Users: CollectionConfig = {
  slug: 'users',
  access: accessByGlobalRoleOrTenantRoleAssignmentOrDomain,
  admin: {
    useAsTitle: 'email',
    group: 'Permissions',
    components: {
      beforeList: ['@/collections/Users/components/InviteUserButton#InviteUserButton'],
    },
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      index: true,
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
    {
      name: 'inviteToken',
      type: 'text',
      hidden: true,
    },
    {
      name: 'inviteExpiration',
      type: 'date',
      hidden: true,
    },
    {
      name: 'status',
      type: 'ui',
      admin: {
        components: {
          Cell: '@/collections/Users/components/Status#StatusCell',
        },
      },
    },
    contentHashField(),
  ],
  hooks: {
    afterLogin: [setCookieBasedOnDomain],
  },
}
