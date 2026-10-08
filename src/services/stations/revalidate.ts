import type { BasePayload, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

// One tag per center covers every station page, the CSV route and the
// graph-data allowlist, so one edit busts them together; they re-read on the
// next request. The precipitation block revalidates with its own page.
export function stationPagesTag(center: string): string {
  return `station-pages:${center}`
}

type TenantRef = number | { id?: number; slug?: string | null } | null | undefined

async function tenantSlugOf(payload: BasePayload, tenant: TenantRef): Promise<string | null> {
  if (tenant && typeof tenant === 'object') return tenant.slug ?? null
  if (typeof tenant !== 'number') return null
  try {
    const doc = await payload.findByID({ collection: 'tenants', id: tenant, depth: 0 })
    return doc.slug
  } catch {
    return null
  }
}

// The nav cache has no time expiry, so a nav link to a renamed or deleted page
// would stay stale until the nav itself is edited.
async function revalidateFor(
  payload: BasePayload,
  tenants: TenantRef[],
  { nav }: { nav: boolean },
): Promise<void> {
  const slugs = new Set<string>()
  for (const tenant of tenants) {
    const slug = await tenantSlugOf(payload, tenant)
    if (slug) slugs.add(slug)
  }
  for (const slug of slugs) {
    payload.logger.info(`Revalidating station pages for ${slug}`)
    revalidateTag(stationPagesTag(slug))
    if (nav) revalidateTag(`navigation-${slug}`)
  }
}

export const revalidateStationPages: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc
  const linkChanged =
    doc?.slug !== previousDoc?.slug || doc?.displayName !== previousDoc?.displayName
  await revalidateFor(payload, [doc?.tenant, previousDoc?.tenant], { nav: linkChanged })
  return doc
}

export const revalidateStationPagesDelete: CollectionAfterDeleteHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc
  await revalidateFor(payload, [doc?.tenant], { nav: true })
  return doc
}
