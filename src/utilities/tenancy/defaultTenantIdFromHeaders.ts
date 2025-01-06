import { BasePayload, parseCookies } from 'payload'

export async function defaultTenantIdFromHeaders(headers: Headers, payload: BasePayload) {
  const cookies = parseCookies(headers)
  const defaultTenantSlug = cookies.get('payload-tenant')
  let defaultTenantId: number | undefined = undefined
  if (defaultTenantSlug) {
    const defaultTenant = await payload
      .find({
        collection: 'tenants',
        depth: 0,
        limit: 1,
        where: {
          slug: {
            equals: defaultTenantSlug,
          },
        },
      })
      .catch(payload.logger.error)
    if (defaultTenant && defaultTenant.docs && defaultTenant.docs.length > 0) {
      defaultTenantId = defaultTenant.docs[0].id
    }
  }
  return defaultTenantId
}
