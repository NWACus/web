import { type CollectionConfig } from 'payload'

import { accessByTenantRoleWithPermissiveRead } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { getEnvironmentFriendlyName } from '@/utilities/getEnvironmentFriendlyName'
import { hasGlobalOrTenantRolePermission } from '@/utilities/rbac/hasGlobalOrTenantRolePermission'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateBlurDataUrl } from './hooks/generateBlurDataUrl'
import { prefixFilenameWithTenant } from './hooks/prefixFilenameWithTenant'
import { revalidateMedia, revalidateMediaDelete } from './hooks/revalidateMedia'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: accessByTenantRoleWithPermissiveRead('media'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Content',
    hidden: ({ user }) =>
      !hasGlobalOrTenantRolePermission({ method: 'read', collection: 'media', user }),
    defaultColumns: ['filename', 'alt', 'url', 'width', 'height'],
  },
  fields: [
    tenantField(),
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Alternative text that describes the image for screen readers and when the image cannot be displayed. This is important for accessibility and SEO.',
      },
    },
    contentHashField(),
    {
      name: 'blurDataUrl',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
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
    staticDir: path.resolve(dirname, '../../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    mimeTypes: ['image/*', 'video/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
    ],
  },
  hooks: {
    beforeOperation: [prefixFilenameWithTenant],
    beforeChange: [generateBlurDataUrl],
    afterChange: [revalidateMedia],
    afterDelete: [revalidateMediaDelete],
  },
}
