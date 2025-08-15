import { byTenantRole } from '@/access/byTenantRole'
import { ruleCollection, ruleMethod } from '@/utilities/rbac/ruleMatches'
import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities'
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

    const roleAccess = byTenantRole(method, collection)(args)
    if (typeof roleAccess === 'boolean' ? roleAccess : true) {
      // if roleAccess returned anything but 'false', pass it along
      return roleAccess
    }

    // allow those without explicit access to see published pages
    return {
      _status: {
        equals: 'published',
      },
    }
  }

export const accessForPagesAndPosts: (collection: ruleCollection) => CollectionConfig['access'] = (
  collection: ruleCollection,
) => {
  return {
    create: ({ req }) => {
      const tenantFromCookie = getTenantFromCookie(req.headers, 'number')
      return tenantFromCookie ? byTenantRole('create', collection)({ req }) : false
    },
    read: byTenantRoleOrPublished('read', collection),
    update: byTenantRole('update', collection),
    delete: byTenantRole('delete', collection),
  }
}
