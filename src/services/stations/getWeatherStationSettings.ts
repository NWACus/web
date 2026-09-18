import { toStationRefs } from '@/fields/stations'
import type { StationRef } from '@/services/snowobs/snowobs'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { stationPagesTag } from './revalidate'

export type WeatherStationSettings = {
  /** The Accumulated Precipitation rows, top to bottom. */
  precipStations: StationRef[]
}

const EMPTY: WeatherStationSettings = { precipStations: [] }

async function loadWeatherStationSettings(center: string): Promise<WeatherStationSettings> {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'weatherStationSettings',
    where: { 'tenant.slug': { equals: center } },
    depth: 0,
    limit: 1,
  })
  const doc = docs[0]
  return doc ? { precipStations: toStationRefs(doc.precipStations) } : EMPTY
}

// Shares the station-pages tag: the precip page reads both, and an edit to
// either should show on the next request.
export async function getWeatherStationSettings(center: string): Promise<WeatherStationSettings> {
  return unstable_cache(
    () => loadWeatherStationSettings(center),
    ['weather-station-settings', center],
    { tags: [stationPagesTag(center)] },
  )()
}
