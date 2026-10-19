import type { Access, CollectionConfig } from 'payload'

import { accessByTenantRole, byTenantRole } from '@/access/byTenantRole'
import { getTenantIDFromCookie } from '@/utilities/tenancy/getTenantFromCookie'

/**
 * byTenantRole answers `true` when the user holds the role in the selected tenant, which grants
 * every tenant's documents to API requests. Folders narrow that to the selected tenant, so the
 * REST API matches what the folder views show. The constraint is on the tenant ID because the
 * folder views' join cannot query 'tenant.slug'.
 */
const withinSelectedTenant =
  (access: Access): Access =>
  async (args) => {
    const result = await access(args)
    if (result !== true) {
      return result
    }

    const tenantID = await getTenantIDFromCookie(args.req)
    return tenantID === null ? true : { tenant: { equals: tenantID } }
  }

// Folders exist to organize media, so media permissions govern them
export const folderAccess: CollectionConfig['access'] = {
  create: accessByTenantRole('media')?.create,
  read: withinSelectedTenant(byTenantRole('read', 'media')),
  update: withinSelectedTenant(byTenantRole('update', 'media')),
  delete: withinSelectedTenant(byTenantRole('delete', 'media')),
}
