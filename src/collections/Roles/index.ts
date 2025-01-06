import type { CollectionConfig, Field } from 'payload'
import { accessByGlobalRole } from '@/access/byGlobalRole'

export const collectionsField: Field = {
  name: 'collections',
  type: 'text',
  hasMany: true,
  required: true,
  admin: {
    components: {
      Field: '@/collections/Roles/components/CollectionsField#CollectionsField',
    },
    position: 'sidebar',
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
    position: 'sidebar',
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

export const Roles: CollectionConfig = {
  slug: 'roles',
  access: accessByGlobalRole('roles'),
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    rulesField,
  ],
}
