import type { CollectionBeforeValidateHook } from 'payload'

import { relationshipID } from '@/utilities/relationships'

/**
 * A folder never changes tenant. Its contents stay with the original tenant, so moving the folder
 * would hide them from that tenant's folder view and leak them into another tenant's. The tenant
 * field follows the admin's tenant selector, so a changed value is reverted rather than rejected.
 */
export const keepFolderTenant: CollectionBeforeValidateHook = ({
  data,
  operation,
  originalDoc,
}) => {
  if (!data || operation !== 'update') return data

  const originalTenantID = relationshipID(originalDoc?.tenant)
  if (originalTenantID !== undefined) {
    data.tenant = originalTenantID
  }

  return data
}
