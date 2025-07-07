import type { CollectionConfig } from 'payload'

import { byGlobalRole } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { accessByGlobalRoleOrTenantRoleAssignmentOrDomain } from './access/byGlobalRoleOrTenantRoleAssignmentOrDomain'
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain'

export const Users: CollectionConfig = {
  slug: 'users',
  access: accessByGlobalRoleOrTenantRoleAssignmentOrDomain,
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
      name: 'globalRoles',
      type: 'relationship',
      relationTo: 'globalRoles',
      hasMany: true,
      saveToJWT: true,
      access: {
        read: byGlobalRole('read', 'globalRoles'),
        create: byGlobalRole('create', 'globalRoles'),
        update: byGlobalRole('update', 'globalRoles'),
      },
    },
    contentHashField(),
  ],
  hooks: {
    afterLogin: [setCookieBasedOnDomain],
  },
}
