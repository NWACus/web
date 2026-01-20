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

  // Add tenant prefix if we have a slug and the filename doesn't already
  // start with the prefix or start with the slug (i.e. the file name is the slug)
  // Avoids file names like 'dvac-dvac-icon.png' and 'dvac-DVAC.webp'
  if (
    tenantSlug &&
    !req.file.name.toLowerCase().startsWith(`${tenantSlug.toLowerCase()}-`) &&
    !req.file.name.toLowerCase().startsWith(tenantSlug.toLowerCase())
  ) {
    req.file.name = `${tenantSlug}-` + req.file.name
  }
}
