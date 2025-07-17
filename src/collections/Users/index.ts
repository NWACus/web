import type { CollectionConfig } from 'payload'

import { byGlobalRole } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { generateForgotPasswordEmail } from '@/utilities/email/generateForgotPasswordEmail'
import { accessByGlobalRoleOrTenantRoleAssignmentOrDomain } from './access/byGlobalRoleOrTenantRoleAssignmentOrDomain'
import { beforeValidatePassword } from './hooks/beforeValidatePassword'
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain'
import { setLastLogin } from './hooks/setLastLogin'

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
    defaultColumns: ['email', 'name', 'roles', 'userStatus'],
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: async (args) => {
        const { html } = await generateForgotPasswordEmail(args)
        return html
      },
    },
  },
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
      name: 'userStatus',
      type: 'ui',
      admin: {
        components: {
          Cell: '@/collections/Users/components/UserStatusCell#UserStatusCell',
        },
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
    afterLogin: [setCookieBasedOnDomain, setLastLogin],
    beforeValidate: [beforeValidatePassword],
  },
}
