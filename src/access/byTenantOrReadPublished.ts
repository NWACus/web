import { Access, CollectionConfig } from 'payload'
import { ruleCollection, ruleMethod } from '@/utilities/rbac/ruleMatches'
import { byTenant } from '@/access/byTenant'

// byTenantOrPublished supplants access review by allowing unauthenticated access to pages
export const byTenantOrPublished: (method: ruleMethod, collection: ruleCollection) => Access =
  (method: ruleMethod, collection: ruleCollection): Access =>
  (args) => {
    if (!args.req.user) {
      return {
        _status: {
          equals: 'published',
        },
      }
    }

    const globalAccess = byTenant(method, collection)(args)
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

export const accessByTenantOrReadPublished: (
  collection: ruleCollection,
) => CollectionConfig['access'] = (collection: ruleCollection) => {
  return {
    create: byTenant('update', collection),
    read: byTenantOrPublished('read', collection),
    update: byTenant('update', collection),
    delete: byTenant('update', collection),
  }
}
