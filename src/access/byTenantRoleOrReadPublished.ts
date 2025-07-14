import { byTenantRole } from '@/access/byTenantRole'
import { ruleCollection, ruleMethod } from '@/utilities/rbac/ruleMatches'
import { Access, CollectionConfig } from 'payload'

// byTenantRoleOrPublished supplants access review by allowing unauthenticated access to pages
export const byTenantRoleOrPublished: (method: ruleMethod, collection: ruleCollection) => Access =
  (method: ruleMethod, collection: ruleCollection): Access =>
  (args) => {
    if (!args.req.user) {
      return {
        _status: {
          equals: 'published',
        },
      }
    }

    const globalAccess = byTenantRole(method, collection)(args)
    if (typeof globalAccess === 'boolean' ? globalAccess : true) {
      // if globalAccess returned anything but 'false', pass it along
      return globalAccess
    }

    // allow those without explicit access to see published pages
    return {
      _status: {
        equals: 'published',
      },
    }
  }

export const accessByTenantRoleOrReadPublished: (
  collection: ruleCollection,
) => CollectionConfig['access'] = (collection: ruleCollection) => {
  return {
    create: byTenantRole('update', collection),
    read: byTenantRoleOrPublished('read', collection),
    update: byTenantRole('update', collection),
    delete: byTenantRole('update', collection),
  }
}
