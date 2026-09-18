import type { StationPageDoc, WeatherStationSetting } from '@/payload-types'
import type { StationRef } from '@/services/snowobs/snowobs'
import type { Where } from 'payload'
import { NWAC_PRECIP_STATIONS, NWAC_STATION_PAGES } from './nwacStationPages'

const SOURCE = 'nwac'

export type SeedResult = { pagesCreated: number; settingsCreated: boolean }

type StationPageSeed = Pick<StationPageDoc, 'slug' | 'displayName' | 'archived' | 'stations'> & {
  tenant: number
}
type SettingsSeed = Pick<WeatherStationSetting, 'precipStations'> & { tenant: number }

// The slice of the local API the seed uses. Payload's client satisfies it, and
// so does a plain object in a test, with no type assertion.
export type SeedPayload = {
  find(args: {
    collection: 'stationPages'
    where: Where
    limit: number
    depth: number
    select: { slug: true }
  }): Promise<{ docs: { slug: string }[] }>
  find(args: {
    collection: 'weatherStationSettings'
    where: Where
    limit: number
    depth: number
  }): Promise<{ docs: unknown[] }>
  create(args: {
    collection: 'stationPages'
    data: StationPageSeed
    context: { disableRevalidate: boolean }
  }): Promise<unknown>
  create(args: {
    collection: 'weatherStationSettings'
    data: SettingsSeed
    context: { disableRevalidate: boolean }
  }): Promise<unknown>
}

function precipStations(): StationRef[] {
  return NWAC_PRECIP_STATIONS.map((stid) => ({ stid, source: SOURCE }))
}

/**
 * Put NWAC's station pages and station settings in place for one tenant,
 * once: a page or settings document that already exists is left exactly as
 * the admin has it.
 *
 * Runs inside migrations (deployed environments) and the local seed script,
 * so it disables the cache hooks -- there is no request to revalidate against.
 */
export async function seedStationPages(
  payload: SeedPayload,
  tenantId: number,
): Promise<SeedResult> {
  const context = { disableRevalidate: true }
  const { docs: existing } = await payload.find({
    collection: 'stationPages',
    where: { tenant: { equals: tenantId } },
    limit: 1000,
    depth: 0,
    select: { slug: true },
  })
  const present = new Set(existing.map((page) => page.slug))

  const result: SeedResult = { pagesCreated: 0, settingsCreated: false }
  for (const page of NWAC_STATION_PAGES) {
    if (present.has(page.slug)) continue
    await payload.create({
      collection: 'stationPages',
      data: {
        tenant: tenantId,
        slug: page.slug,
        displayName: page.displayName,
        archived: page.archived,
        stations: page.stids.map((stid) => ({ stid, source: SOURCE })),
      },
      context,
    })
    result.pagesCreated++
  }

  const { docs: settings } = await payload.find({
    collection: 'weatherStationSettings',
    where: { tenant: { equals: tenantId } },
    limit: 1,
    depth: 0,
  })
  if (settings.length === 0) {
    await payload.create({
      collection: 'weatherStationSettings',
      data: { tenant: tenantId, precipStations: precipStations() },
      context,
    })
    result.settingsCreated = true
  }
  return result
}
