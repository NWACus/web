import { accessByGlobalRole } from '@/access/byGlobalRole'
import { contentHashField } from '@/fields/contentHashField'
import type { CollectionConfig, Field } from 'payload'

export const collectionsField: Field = {
  name: 'collections',
  type: 'text',
  hasMany: true,
  required: true,
  admin: {
    components: {
      Field: '@/collections/Roles/components/CollectionsField#CollectionsField',
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
  access: accessByGlobalRole('globalRoles'),
  admin: {
    useAsTitle: 'name',
    group: 'Permissions',
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
