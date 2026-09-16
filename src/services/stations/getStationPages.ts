import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { stationPagesTag } from './revalidate'
import type { StationPage } from './stationPages'
import { assembleStationPages } from './stationPages'

export { allStationIds, precipStationIds, toPageSummaries } from './stationPages'
export type { StationPage, StationPageSummary } from './stationPages'

async function loadStationPages(center: string): Promise<StationPage[]> {
  const payload = await getPayload({ config: configPromise })

  const [{ docs: pages }, { docs: stations }] = await Promise.all([
    payload.find({
      collection: 'stationPages',
      where: { 'tenant.slug': { equals: center } },
      depth: 0,
      limit: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'stations',
      where: { and: [{ 'tenant.slug': { equals: center } }, { page: { exists: true } }] },
      depth: 0,
      limit: 0,
      pagination: false,
    }),
  ])

  return assembleStationPages(pages, stations)
}

// Cached per center and busted by the collection hooks, so an admin edit shows
// on the next request without waiting out the ISR window.
export const getCachedStationPages = (center: string) =>
  unstable_cache(() => loadStationPages(center), ['station-pages', center], {
    tags: [stationPagesTag(center)],
  })

export async function getStationPages(center: string): Promise<StationPage[]> {
  return getCachedStationPages(center)()
}

export async function getStationPage(center: string, slug: string): Promise<StationPage | null> {
  const pages = await getStationPages(center)
  return pages.find((page) => page.slug === slug) ?? null
}

// Every (center, slug) pair, for build-time prerendering of the station pages.
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
