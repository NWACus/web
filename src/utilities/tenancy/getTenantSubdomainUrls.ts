import { PROTOCOL, ROOT_DOMAIN } from '../domain'
import { getTenants } from './getTenants'

export async function getTenantSubdomainUrls() {
  const tenants = await getTenants()
  return tenants.map(({ slug }) => `${PROTOCOL}://${slug}.${ROOT_DOMAIN}`)
}
