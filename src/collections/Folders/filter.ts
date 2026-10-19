import type { BaseFilter } from 'payload'

import { filterByTenantID } from '@/access/filterByTenant'

// Folder cards show only a name, so with no center selected every center's same-named folders
// look identical. Folder views stay empty until a center is selected.
export const filterFoldersByTenant: BaseFilter = async (args) =>
  (await filterByTenantID(args)) ?? { id: { exists: false } }
