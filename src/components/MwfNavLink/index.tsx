import { hasGlobalOrTenantRolePermission } from '@/utilities/rbac/hasGlobalOrTenantRolePermission'
import { getTenantSlugFromCookie } from '@/utilities/tenancy/getTenantFromCookie'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { ServerProps } from 'payload'

// Admin-nav entry for the MWF authoring view. The raw mwfForecasts collection
// is hidden from the nav (super-admin debugging only) — this link is the
// intended way in, and it only appears when the selected tenant has the MWF
// flag on and the user has mwfForecasts access.
export async function MwfNavLink({ payload, user }: ServerProps) {
  if (!user || !payload) return null
  if (!hasGlobalOrTenantRolePermission({ method: 'read', collection: 'mwfForecasts', user })) {
    return null
  }
  const tenantSlug = getTenantSlugFromCookie(await headers())
  if (!tenantSlug) return null

  const tenants = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: tenantSlug } },
    limit: 1,
    depth: 0,
  })
  const tenant = tenants.docs[0]
  if (!tenant) return null
  const settings = await payload.find({
    collection: 'settings',
    where: { tenant: { equals: tenant.id } },
    limit: 1,
    depth: 0,
  })
  if (!settings.docs[0]?.nativeProducts?.mwf) return null

  return (
    <div className="nav-group">
      <div className="nav-group__label">Mountain Weather</div>
      <Link className="nav__link" href="/admin/mwf" prefetch={false}>
        <span className="nav__link-label">MWF Editor</span>
      </Link>
    </div>
  )
}
