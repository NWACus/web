import type { Config } from 'payload'

import { filterByTenantID } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { folderAccess } from './access'
import { FOLDER_FIELD_NAME, FOLDERS_SLUG } from './constants'
import { keepFolderTenant } from './hooks/keepFolderTenant'
import { validateFolderTenant } from './hooks/validateFolderTenant'

type FoldersConfig = Exclude<NonNullable<Config['folders']>, false>

/**
 * Root config for Payload's folders (beta: may change in minor Payload versions).
 *
 * Payload generates one folder collection shared by every folder-enabled collection, with no
 * notion of tenancy and access open to any logged-in user. The override makes folders a
 * tenant-scoped collection: a tenant field, the selected-tenant base filter (which Payload's folder
 * views and move-to-folder drawer apply), access limited to the selected tenant, and guards that
 * keep a folder, its parent, and its tenant together.
 *
 * Folder-enabled collections must also register `validateFolderTenant`.
 */
export const folders: FoldersConfig = {
  slug: FOLDERS_SLUG,
  fieldName: FOLDER_FIELD_NAME,
  collectionOverrides: [
    ({ collection }) => ({
      ...collection,
      access: folderAccess,
      admin: {
        ...collection.admin,
        baseListFilter: filterByTenantID,
      },
      fields: [tenantField(), ...collection.fields, contentHashField()],
      hooks: {
        ...collection.hooks,
        beforeValidate: [
          ...(collection.hooks?.beforeValidate ?? []),
          keepFolderTenant,
          validateFolderTenant,
        ],
      },
    }),
  ],
}
