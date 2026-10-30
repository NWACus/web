import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

import { isValidRelationship, relationshipID } from '@/utilities/relationships'
import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import { FOLDER_FIELD_NAME, FOLDERS_SLUG } from '../constants'

/**
 * Refuses to file a document (or nest a folder) inside a folder that belongs to another tenant.
 * The admin's folder pickers only list the selected tenant's folders, but the API accepts any
 * folder ID, so this is the server-side guarantee that folders never mix tenants.
 *
 * Registered on the folder collection and on every folder-enabled collection.
 */
export const validateFolderTenant: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data

  const folderID = relationshipID(
    FOLDER_FIELD_NAME in data ? data[FOLDER_FIELD_NAME] : originalDoc?.[FOLDER_FIELD_NAME],
  )
  if (folderID === undefined) return data

  const folder = await req.payload.findByID({
    collection: FOLDERS_SLUG,
    id: folderID,
    depth: 1,
    select: { tenant: true },
    populate: { tenants: { slug: true } },
    disableErrors: true,
    req,
  })
  // A missing folder is reported by the folder field's own relationship validation.
  if (!folder) return data

  // On create the tenant may not be set yet: tenantField fills it from the cookie in beforeChange.
  const tenantID = relationshipID(data.tenant ?? originalDoc?.tenant)
  const cookieTenantSlug = getTenantSlugFromCookie(req.headers)
  let sameTenant: boolean
  if (tenantID !== undefined) {
    sameTenant = relationshipID(folder.tenant) === tenantID
  } else if (cookieTenantSlug) {
    sameTenant = isValidRelationship(folder.tenant) && folder.tenant.slug === cookieTenantSlug
  } else {
    // No tenant to compare against; tenantField rejects the write.
    return data
  }

  if (!sameTenant) {
    throw new ValidationError(
      {
        errors: [
          {
            message: 'This folder belongs to a different avalanche center.',
            path: FOLDER_FIELD_NAME,
          },
        ],
      },
      req.t,
    )
  }

  return data
}
