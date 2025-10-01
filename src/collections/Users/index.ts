import type { CollectionConfig } from 'payload'

import { byGlobalRole } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { generateForgotPasswordEmail } from '@/utilities/email/generateForgotPasswordEmail'
import { accessByGlobalRoleOrTenantRoleAssignmentOrDomain } from './access/byGlobalRoleOrTenantRoleAssignmentOrDomain'
import { filterByTenantScopedDomain } from './access/filterByTenantScopedDomain'
import { beforeValidatePassword } from './hooks/beforeValidatePassword'
import { posthogIdentifyAfterLogin } from './hooks/posthogIdentifyAfterLogin'
import { setLastLogin } from './hooks/setLastLogin'
import { validateDomainAccessBeforeLogin } from './hooks/validateDomainAccessBeforeLogin'

export const Users: CollectionConfig = {
  slug: 'users',
  access: accessByGlobalRoleOrTenantRoleAssignmentOrDomain,
  admin: {
    useAsTitle: 'email',
    group: 'Permissions',
    baseListFilter: filterByTenantScopedDomain,
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
      maxDepth: 4,
      admin: {
        defaultColumns: ['role'],
        description:
          "This is where you assign the user's permissions to the site. See the documentation for more information on roles.",
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
        position: 'sidebar',
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
    afterLogin: [setLastLogin, posthogIdentifyAfterLogin],
    beforeLogin: [validateDomainAccessBeforeLogin],
    beforeValidate: [beforeValidatePassword],
  },
}
