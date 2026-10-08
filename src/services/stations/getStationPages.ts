import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { stationPagesTag } from './revalidate'
import type { AssembledStationPage } from './stationPages'
import { assembleStationPages } from './stationPages'

export { allStations, areaPageFor, stationPagePath, toPageSummaries } from './stationPages'
export type { AssembledStationPage, StationPageSummary } from './stationPages'

async function loadStationPages(center: string): Promise<AssembledStationPage[]> {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'stationPages',
    where: { 'tenant.slug': { equals: center } },
    depth: 0,
    limit: 0,
    pagination: false,
  })
  return assembleStationPages(docs)
}

// Bump when AssembledStationPage changes shape. Vercel's data cache outlives a
// deploy and is shared across deployments, so an entry written by older code
// would otherwise be read as the new shape (pages without `tabs` crashed).
const STATION_PAGES_CACHE_VERSION = 'v2-tabs'

// Cached per center and busted by the collection hooks, so an admin edit shows
// on the next request without waiting out the ISR window.
export const getCachedStationPages = (center: string) =>
  unstable_cache(
    () => loadStationPages(center),
    ['station-pages', STATION_PAGES_CACHE_VERSION, center],
    {
      tags: [stationPagesTag(center)],
    },
  )

export async function getStationPages(center: string): Promise<AssembledStationPage[]> {
  return getCachedStationPages(center)()
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
