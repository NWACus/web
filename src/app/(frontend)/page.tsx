/**
 * The root landing page: a directory of the avalanche centers that run their sites on AvyWeb.
 *
 * Only production tenants are listed — the ones routed to their custom domain via
 * `PRODUCTION_TENANTS` — so a center that is provisioned but not yet launched stays out of sight.
 * Each row pairs the center's identity with its live danger map; the map fetches its zones in the
 * browser on every load, so the ratings stay current even though this page is static.
 *
 * Design settled 2026-09-09 after a three-variant prototype: board rows won over one-map-per-
 * section and a single switchable map, without per-zone rating chips.
 */
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { AvalancheOrgSection } from '@/components/landing/AvalancheOrgSection'
import { CenterDirectory } from '@/components/landing/CenterDirectory'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import type { DirectoryCenter } from '@/components/landing/types'
import type { Media, Setting } from '@/payload-types'
import { AVALANCHE_CENTERS, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { PRODUCTION_TENANTS } from '@/utilities/tenancy/tenants'

export const dynamic = 'force-static'

/** The template tenant, never a real center; excluded from the local stand-in list. */
const TEMPLATE_TENANT_SLUG = 'dvac'

async function getDirectoryCenters(): Promise<DirectoryCenter[]> {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload
    .find({ collection: 'tenants', limit: 1000, sort: 'name' })
    .then((result) => result.docs)

  // Local dev has no PRODUCTION_TENANTS, so it stands in with every seeded center except the
  // template. Anywhere the env var is set, it is the only source of truth.
  const productionSlugs =
    PRODUCTION_TENANTS.length > 0
      ? PRODUCTION_TENANTS
      : tenants
          .map((tenant) => tenant.slug)
          .filter(isValidTenantSlug)
          .filter((slug) => slug !== TEMPLATE_TENANT_SLUG)

  const productionTenants = tenants.filter(
    (tenant) => isValidTenantSlug(tenant.slug) && productionSlugs.includes(tenant.slug),
  )

  const settings = await payload
    .find({
      collection: 'settings',
      where: { tenant: { in: productionTenants.map((tenant) => tenant.id) } },
      select: { logo: true, description: true, tenant: true },
    })
    .then((result) => result.docs)

  return productionTenants.flatMap((tenant) => {
    if (!isValidTenantSlug(tenant.slug)) return []

    const tenantSettings = settings.find((doc) => settingsTenantId(doc) === tenant.id)
    const customDomain = AVALANCHE_CENTERS[tenant.slug].customDomain

    return [
      {
        slug: tenant.slug,
        name: tenant.name,
        // Strip a leading `www.` for display; the link keeps the full host.
        domain: customDomain.replace(/^www\./, ''),
        // Always https: these are the live custom domains, whatever protocol this page serves on.
        href: `https://${customDomain}`,
        description: tenantSettings?.description ?? null,
        logo: resolvedLogo(tenantSettings),
      },
    ]
  })
}

function settingsTenantId(doc: Pick<Setting, 'tenant'>): number {
  return typeof doc.tenant === 'number' ? doc.tenant : doc.tenant.id
}

/** The logo only when the relationship came back populated; an unresolved id has nothing to render. */
function resolvedLogo(doc: Pick<Setting, 'logo'> | undefined): Media | null {
  const logo = doc?.logo
  return logo && typeof logo === 'object' ? logo : null
}

export default async function LandingPage() {
  const centers = await getDirectoryCenters()

  return (
    <div className="bg-white text-[#14213d]">
      <LandingHeader />
      <CenterDirectory centers={centers} />
      <AvalancheOrgSection />
      <LandingFooter />
    </div>
  )
}
