import { toStationRefs } from '@/fields/stations'
import type { StationRef } from '@/services/snowobs/snowobs'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import type { PrecipColumn } from './precipColumns'
import { ALL_PRECIP_COLUMNS, toPrecipColumns } from './precipColumns'
import { stationPagesTag } from './revalidate'

export type WeatherStationSettings = {
  /** The Accumulated Precipitation rows, top to bottom. */
  precipStations: StationRef[]
  /** Its columns after the station name. */
  precipColumns: PrecipColumn[]
}

const EMPTY: WeatherStationSettings = { precipStations: [], precipColumns: ALL_PRECIP_COLUMNS }

async function loadWeatherStationSettings(center: string): Promise<WeatherStationSettings> {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'weatherStationSettings',
    where: { 'tenant.slug': { equals: center } },
    depth: 0,
    limit: 1,
  })
  const doc = docs[0]
  if (!doc) return EMPTY
  return {
    precipStations: toStationRefs(doc.precipStations),
    precipColumns: toPrecipColumns(doc.precipColumns),
  }
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
