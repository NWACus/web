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
    components: {
      beforeList: ['@/collections/Users/components/InviteUser#InviteUser'],
      edit: {
        beforeDocumentControls: [
          '@/collections/Users/components/ResendInviteButton#ResendInviteButton',
        ],
      },
    },
    defaultColumns: ['email', 'name', 'roles', 'inviteStatus'],
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
      name: 'inviteStatus',
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
