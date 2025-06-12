import { CollectionConfig } from 'payload'

type BeforeOperationHook = Exclude<
  Exclude<CollectionConfig['hooks'], undefined>['beforeOperation'],
  undefined
>[number]
export const prefixFilenameWithTenant: BeforeOperationHook = async ({ req }) => {
  if (req.file) {
    req.payload.logger.debug(`media: have data ${JSON.stringify(req.data)}`)
    const media = req.data
    let tenantSlug: string | undefined = undefined
    if (media && 'tenant' in media && typeof media.tenant === 'number') {
      req.payload.logger.debug(`media: fetching slug for tenant ${media.tenant}`)
      const tenant = await req.payload.find({
        collection: 'tenants',
        select: {
          slug: true,
        },
        where: {
          id: {
            equals: media.tenant,
          },
        },
      })
      req.payload.logger.debug(
        `media: got ${tenant.docs ? tenant.docs.length : 0} documents querying for tenant ${media.tenant}`,
      )
      if (tenant.docs && tenant.docs.length > 0) {
        tenantSlug = tenant.docs[0].slug
        req.payload.logger.debug(`media: using result slug for tenant ${tenant.docs[0].slug}`)
      }
    } else if (media && 'tenant' in media && typeof media.tenant === 'object') {
      req.payload.logger.debug(`media: using literal slug for tenant ${media.tenant.slug}`)
      tenantSlug = media.tenant.slug
    } else {
      req.payload.logger.debug(
        `media: unknown tenant, have media ${!!media}, tenant in media: ${media && 'tenant' in media}, type of tenant ${media && 'tenant' in media ? typeof media.tenant : 'unknown'}, tenant: ${media && 'tenant' in media ? JSON.stringify(media.tenant) : 'unknown'}`,
      )
    }
    if (tenantSlug) {
      req.file.name = `${tenantSlug}-` + req.file.name
      req.payload.logger.debug(`updated media filename to ${req.file.name}`)
    }
  }
}
