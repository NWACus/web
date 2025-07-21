import type { CollectionConfig } from 'payload'

import { byGlobalRole } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { accessByGlobalRoleOrTenantRoleAssignmentOrDomain } from './access/byGlobalRoleOrTenantRoleAssignmentOrDomain'
import { filterByTenantScopedDomain } from './access/filterByTenantScopedDomain'
import { setLastLogin } from './hooks/setLastLogin'

export const Users: CollectionConfig = {
  slug: 'users',
  access: accessByGlobalRoleOrTenantRoleAssignmentOrDomain,
  admin: {
    useAsTitle: 'email',
    group: 'Permissions',
    baseListFilter: filterByTenantScopedDomain,
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
      name: 'roles',
      type: 'join',
      collection: 'roleAssignments',
      on: 'user',
      saveToJWT: true,
      maxDepth: 3,
      admin: {
        defaultColumns: ['role'],
      },
    },
    {
      name: 'globalRoleAssignments',
      type: 'join',
      collection: 'globalRoleAssignments',
      on: 'user',
      saveToJWT: true,
      maxDepth: 3,
      admin: {
        defaultColumns: ['globalRole'],
      },
      access: {
        read: byGlobalRole('read', 'globalRoles'),
      },
    },
    {
      name: 'lastLogin',
      type: 'date',
      admin: {
        readOnly: true,
        date: {
          displayFormat: 'LLLL do yyyy, hh:mm a',
        },
        condition: (_data, _siblingData, ctx) => {
          if (ctx.operation === 'create') {
            return false
          }
          return true
        },
      },
    },
    contentHashField(),
  ],
  hooks: {
    afterLogin: [setLastLogin],
  },
}
