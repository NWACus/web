import { Tenant } from '@/payload-types'
import { isTenantValue } from '@/utilities/isTenantValue'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { CollectionConfig } from 'payload'

type BeforeOperationHook = Exclude<
  Exclude<CollectionConfig['hooks'], undefined>['beforeOperation'],
  undefined
>[number]

export const prefixFilenameWithTenant: BeforeOperationHook = async ({ args, operation, req }) => {
  // Only process create and update operations that have a file
  if ((operation !== 'create' && operation !== 'update') || !req.file) {
    return
  }

  // Get data from args (works for both Local API and REST API)
  // For create/update operations, args.data contains the document data
  const media = args.data

  let tenantSlug: Tenant['slug'] | undefined = undefined

  if (isTenantValue(media.tenant)) {
    const tenant = await resolveTenant(media.tenant)

    if (tenant) {
      tenantSlug = tenant.slug
    }
  }

  // Always prefix with the tenant slug, even when the name already starts with it
  // (e.g. 'dvac-dvac-icon.png'), so every tenant's files are named consistently.
  if (tenantSlug) {
    req.file.name = `${tenantSlug}-` + req.file.name

    // Admin uploads go straight from the browser to blob storage (clientUploads: true)
    // under the original filename, and since Payload 3.82 the cloud-storage plugin skips
    // the server-side upload for any file that still carries clientUploadContext. Left
    // alone, the renamed document would point at a blob that was never written. Dropping
    // the context makes the plugin upload req.file.data under the tenant-prefixed name,
    // which is what happened for every upload before 3.82.
    if ('clientUploadContext' in req.file) {
      delete req.file.clientUploadContext
    }
  }
}
