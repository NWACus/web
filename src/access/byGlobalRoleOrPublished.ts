import { ruleCollection, ruleMethod } from '@/utilities/rbac/ruleMatches'
import { Access, CollectionConfig } from 'payload'
import { byGlobalRole } from './byGlobalRole'

/// byGlobalRoleOrPublished mirrors byTenantRoleOrPublished but checks global roles instead
const byGlobalRoleOrPublished: (method: ruleMethod, collection: ruleCollection) => Access =
  (method: ruleMethod, collection: ruleCollection): Access =>
  (args) => {
    if (!args.req.user) {
      return {
        _status: {
          equals: 'published',
        },
      }
    }

    const roleAccess = byGlobalRole(method, collection)(args)
    if (roleAccess) return true

    return {
      _status: {
        equals: 'published',
      },
    }
  }

// Super admins can CRUD, unauthenticated users can read published content
export const accessByGlobalRoleOrReadPublished: (
  collection: ruleCollection,
) => CollectionConfig['access'] = (collection: ruleCollection) => {
  return {
    create: byGlobalRole('create', collection),
    read: byGlobalRoleOrPublished('read', collection),
    update: byGlobalRole('update', collection),
    delete: byGlobalRole('delete', collection),
  }
}
