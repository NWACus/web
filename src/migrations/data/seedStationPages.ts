import type { BasePayload } from 'payload'
import { NWAC_STATION_PAGES, NWAC_STATION_SNAPSHOT } from './nwacStationPages'

const SOURCE = 'nwac'

export type SeedResult = {
  groupsCreated: number
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
  const result: SeedResult = { groupsCreated: 0, stationsCreated: 0, stationsAssigned: 0 }

  const { docs: existingGroups } = await payload.find({
    collection: 'stationGroups',
    where: { tenant: { equals: tenantId } },
    limit: 1000,
    depth: 0,
  })
  const groupIdBySlug = new Map(existingGroups.map((group) => [group.slug, group.id]))

  for (const page of NWAC_STATION_PAGES) {
    if (groupIdBySlug.has(page.slug)) continue
    const created = await payload.create({
      collection: 'stationGroups',
      data: {
        tenant: tenantId,
        slug: page.slug,
        displayName: page.displayName,
        archived: page.archived,
      },
      context,
    })
    groupIdBySlug.set(page.slug, created.id)
    result.groupsCreated++
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

  for (const snapshot of NWAC_STATION_SNAPSHOT) {
    const target = assignment.get(snapshot.stid)
    const groupId = target ? groupIdBySlug.get(target.slug) : undefined
    const current = stationByStid.get(snapshot.stid)

    if (!current) {
      await payload.create({
        collection: 'stations',
        data: {
          tenant: tenantId,
          source: SOURCE,
          ...snapshot,
          ...(groupId != null && target ? { group: groupId, groupOrder: target.order } : {}),
        },
        context,
      })
      result.stationsCreated++
      if (groupId != null) result.stationsAssigned++
      continue
    }

    if (current.group != null || groupId == null || !target) continue
    await payload.update({
      collection: 'stations',
      id: current.id,
      data: { group: groupId, groupOrder: target.order },
      context,
    })
    result.stationsAssigned++
  }

  return result
}
