import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { stationPagesTag } from './revalidate'
import type { AssembledStationPage } from './stationPages'
import { assembleStationPages } from './stationPages'

export { allStations, areaPageFor, stationPagePath, toPageSummaries } from './stationPages'
export type { AssembledStationPage, StationPageSummary } from './stationPages'

async function loadStationPageRows(center: string) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'stationPages',
    where: { 'tenant.slug': { equals: center } },
    depth: 0,
    limit: 0,
    pagination: false,
  })
  return docs
}

// The raw rows are cached, not the assembled pages: Vercel's data cache is
// shared across deployments, so a cached shape outlives the code that wrote it,
// and assembly already copes with fields an older row lacks. Busted by the
// collection hooks, so an admin edit shows on the next request.
const getCachedStationPageRows = (center: string) =>
  unstable_cache(() => loadStationPageRows(center), ['station-page-rows', center], {
    tags: [stationPagesTag(center)],
  })

export async function getStationPages(center: string): Promise<AssembledStationPage[]> {
  return assembleStationPages(await getCachedStationPageRows(center)())
}

export async function getStationPage(
  center: string,
  slug: string,
): Promise<AssembledStationPage | null> {
  const pages = await getStationPages(center)
  return pages.find((page) => page.slug === slug) ?? null
}

export async function allStationPageParams(): Promise<{ center: string; station: string }[]> {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'stationPages',
    depth: 1,
    limit: 0,
    pagination: false,
    select: { slug: true, tenant: true },
  })
  return docs.flatMap((page) => {
    const tenant = page.tenant
    if (!tenant || typeof tenant !== 'object') return []
    return [{ center: tenant.slug, station: page.slug }]
  })
}
