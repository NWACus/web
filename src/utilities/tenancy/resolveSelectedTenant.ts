import { getUser } from '@/utilities/isUser'
import { isValidTenantSlug, ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import type { PayloadRequest } from 'payload'

export type SelectedTenant =
  | { kind: 'selected'; slug: ValidTenantSlug; name: string }
  /** The user can see several centers and has not picked one in the sidebar. */
  | { kind: 'unselected' }
  /** The user has no center at all, e.g. a course provider manager. */
  | { kind: 'none' }

/**
 * Mirrors the sidebar tenant selector for server-rendered admin surfaces: the `payload-tenant`
 * cookie when it names a center the user can access, otherwise the only center they can access.
 */
export async function resolveSelectedTenant(
  req: Pick<PayloadRequest, 'user' | 'payload' | 'headers'>,
): Promise<SelectedTenant> {
  const user = getUser(req)
  if (!user) return { kind: 'none' }

  const { docs } = await req.payload.find({
    collection: 'tenants',
    depth: 0,
    limit: 0,
    overrideAccess: false,
    user,
    select: { name: true, slug: true },
    sort: 'name',
  })

  const tenants = docs.flatMap((doc) =>
    isValidTenantSlug(doc.slug) ? [{ slug: doc.slug, name: doc.name }] : [],
  )
  if (tenants.length === 0) return { kind: 'none' }

  const cookieSlug = getTenantSlugFromCookie(req.headers)
  const selected =
    tenants.find((tenant) => tenant.slug === cookieSlug) ??
    (tenants.length === 1 ? tenants[0] : undefined)

  return selected ? { kind: 'selected', ...selected } : { kind: 'unselected' }
}
