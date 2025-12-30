import type { CollectionConfig } from 'payload'

import { accessByTenantRoleWithPermissiveRead } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { getEnvironmentFriendlyName } from '@/utilities/getEnvironmentFriendlyName'
import { hasGlobalOrTenantRolePermission } from '@/utilities/rbac/hasGlobalOrTenantRolePermission'
import path from 'path'
import { fileURLToPath } from 'url'
import { prefixFilenameWithTenant } from '../Media/hooks/prefixFilenameWithTenant'
import { revalidateMedia, revalidateMediaDelete } from '../Media/hooks/revalidateMedia'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Documents: CollectionConfig = {
  slug: 'documents',
  access: accessByTenantRoleWithPermissiveRead('documents'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Content',
    hidden: ({ user }) =>
      !hasGlobalOrTenantRolePermission({ method: 'read', collection: 'media', user }),
  },
  fields: [
    tenantField(),
    contentHashField(),
    {
      name: 'prefix',
      type: 'text',
      defaultValue: getEnvironmentFriendlyName(),
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../../public/documents'),
    mimeTypes: ['application/pdf', 'text/x-php', 'text/xml'],
  },
  hooks: {
    beforeOperation: [prefixFilenameWithTenant],
    afterChange: [revalidateMedia],
    afterDelete: [revalidateMediaDelete],
  },
}
