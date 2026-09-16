import type { BasePayload } from 'payload'
import { NWAC_STATION_PAGES, NWAC_STATION_SNAPSHOT } from './nwacStationPages'

const SOURCE = 'nwac'

export type SeedResult = {
  pagesCreated: number
  stationsCreated: number
  stationsAssigned: number
}

/**
 * Put NWAC's station pages in place for one tenant.
 *
 * Idempotent, and careful with what an admin may already have done: a page
 * that exists is left alone, a station that exists keeps its identity fields
 * for the sync to refresh, and a station already assigned to a page keeps
 * that assignment. Only gaps get filled.
 *
 * Runs inside migrations (deployed environments) and the local seed script,
 * so it disables the cache hooks -- there is no request to revalidate against.
 */
export async function seedStationPages(
  payload: BasePayload,
  tenantId: number,
): Promise<SeedResult> {
  const context = { disableRevalidate: true }
  const result: SeedResult = { pagesCreated: 0, stationsCreated: 0, stationsAssigned: 0 }

  const { docs: existingPages } = await payload.find({
    collection: 'stationPages',
    where: { tenant: { equals: tenantId } },
    limit: 1000,
    depth: 0,
  })
  const pageIdBySlug = new Map(existingPages.map((page) => [page.slug, page.id]))

  for (const page of NWAC_STATION_PAGES) {
    if (pageIdBySlug.has(page.slug)) continue
    const created = await payload.create({
      collection: 'stationPages',
      data: {
        tenant: tenantId,
        slug: page.slug,
        displayName: page.displayName,
        archived: page.archived,
      },
      context,
    })
    pageIdBySlug.set(page.slug, created.id)
    result.pagesCreated++
  }

  const { docs: existingStations } = await payload.find({
    collection: 'stations',
    where: { and: [{ tenant: { equals: tenantId } }, { source: { equals: SOURCE } }] },
    limit: 1000,
    depth: 0,
  })
  const stationByStid = new Map(existingStations.map((station) => [station.stid, station]))

  // Page order is the position in the page's stid list.
  const assignment = new Map<string, { slug: string; order: number }>()
  for (const page of NWAC_STATION_PAGES) {
    page.stids.forEach((stid, order) => assignment.set(stid, { slug: page.slug, order }))
  }

  // Only the stations a page shows. The snapshot is the whole SnowObs catalogue,
  // and the rest of it (a retired logger, 5-minute duplicates of hourly
  // stations) has no place on the site; the sync brings in what SnowObs tracks.
  for (const snapshot of NWAC_STATION_SNAPSHOT) {
    const target = assignment.get(snapshot.stid)
    if (!target) continue
    const pageId = pageIdBySlug.get(target.slug)
    if (pageId == null) continue
    const current = stationByStid.get(snapshot.stid)

    if (!current) {
      await payload.create({
        collection: 'stations',
        data: {
          tenant: tenantId,
          source: SOURCE,
          ...snapshot,
          page: pageId,
          pageOrder: target.order,
        },
        context,
      })
      result.stationsCreated++
      result.stationsAssigned++
      continue
    }

    if (current.page != null) continue
    await payload.update({
      collection: 'stations',
      id: current.id,
      data: { page: pageId, pageOrder: target.order },
      context,
    })
    result.stationsAssigned++
  }

  return result
}
