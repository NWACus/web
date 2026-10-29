import type { CollectionConfig } from 'payload'
import { membersAccess } from './access'
import { deleteMemberAuthRows, deleteMemberRows } from './deleteMemberRows'
import { memberSessionStrategy } from './strategy'

/**
 * Public (non-staff) accounts, authenticated by Better Auth (ADR 026). Payload owns the table;
 * Better Auth's `user` model is mapped onto it, so Better Auth writes bypass these hooks.
 */
export const Members: CollectionConfig = {
  slug: 'members',
  access: membersAccess,
  admin: {
    useAsTitle: 'email',
    group: 'Members',
    defaultColumns: ['email', 'name', 'isAnonymous', 'createdAt'],
  },
  auth: {
    disableLocalStrategy: true,
    strategies: [memberSessionStrategy],
  },
  fields: [
    // Text id so Better Auth can generate ids for every model the same way.
    {
      name: 'id',
      type: 'text',
      required: true,
      admin: { readOnly: true },
      hooks: {
        beforeValidate: [({ value }) => value || crypto.randomUUID().replace(/-/g, '')],
      },
    },
    { name: 'name', type: 'text' },
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    { name: 'emailVerified', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
    { name: 'image', type: 'text' },
    {
      name: 'isAnonymous',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'preferences',
      type: 'json',
      admin: { description: 'Site preferences. A site session on a center host may write these.' },
    },
    { name: 'memberships', type: 'join', collection: 'memberships', on: 'member' },
    { name: 'devices', type: 'join', collection: 'devices', on: 'member' },
    { name: 'subscriptions', type: 'join', collection: 'subscriptions', on: 'member' },
  ],
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        if (typeof id !== 'string') return
        await deleteMemberRows(req.payload, id)
        await deleteMemberAuthRows(req.payload, id)
      },
    ],
  },
}
