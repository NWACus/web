import { accessByGlobalRoleWithAuthenticatedRead } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import { hasReadOnlyAccess } from '@/utilities/rbac/hasReadOnlyAccess'
import type { CollectionConfig, Field } from 'payload'

export const collectionsField: Field = {
  name: 'collections',
  type: 'text',
  hasMany: true,
  required: true,
  admin: {
    components: {
      Field: {
        path: '@/collections/Roles/components/CollectionsField#CollectionsField',
        serverProps: {
          includeGlobals: true,
        },
      },
    },
  },
}

export const rulesField: Field = {
  name: 'rules',
  type: 'array',
  required: true,
  admin: {
    components: {
      Cell: '@/collections/Roles/components/RulesCell#RulesCell',
    },
  },
  fields: [
    collectionsField,
    {
      name: 'actions',
      type: 'select',
      hasMany: true,
      options: ['*', 'create', 'read', 'update', 'delete'],
      required: true,
    },
  ],
}

export const GlobalRoles: CollectionConfig = {
  slug: 'globalRoles',
  access: accessByGlobalRoleWithAuthenticatedRead('globalRoles'),
  admin: {
    useAsTitle: 'name',
    group: 'Permissions',
    hidden: ({ user }) => hasReadOnlyAccess(user, 'roleAssignments'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    rulesField,
    contentHashField(),
  ],
}
