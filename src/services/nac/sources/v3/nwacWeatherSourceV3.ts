/** NWAC's Mountain Weather Forecast from products-api v3 (`/v3/public/nwac-weather/…`). */
import { unstable_cache } from 'next/cache'

import type { NWACWeatherForecastDay } from '../../model/nwacWeather'
import { nwacWeatherCacheTag } from '../../nac'
import {
  nwacWeatherArchiveSchema,
  nwacWeatherForecastsResponseSchema,
} from '../../types/nwacWeatherSchemas'
import type { NWACWeatherSource } from '../types'
import { v3Fetch } from './fetch'
import { mapV3NWACWeatherForecastDay } from './nwacWeatherMappers'

const CACHE = { cachedTime: 300, tags: [nwacWeatherCacheTag] }
// A past date's forecast no longer changes; the tag still lets a purge reach it.
const HISTORICAL_CACHE = { cachedTime: 30 * 24 * 60 * 60, tags: [nwacWeatherCacheTag] }

// With no date, v3 answers with the latest date that has a forecast.
const LATEST_PATH = 'nwac-weather/forecasts'

function dayPath(date: string) {
  return `${LATEST_PATH}?${new URLSearchParams({ date })}`
}

export const nwacWeatherSourceV3: NWACWeatherSource = {
  async getDay(date, { historical = false } = {}) {
    const wire = await v3Fetch(
      dayPath(date),
      nwacWeatherForecastsResponseSchema,
      historical ? HISTORICAL_CACHE : CACHE,
    )
    return mapV3NWACWeatherForecastDay(wire)
  },

  async getLatest() {
    const wire = await v3Fetch(LATEST_PATH, nwacWeatherForecastsResponseSchema, CACHE)
    return mapV3NWACWeatherForecastDay(wire)
  },

  // Half the on-view staleness budget, as `fetchForecastFresh` is; a rejection is never cached.
  async getLatestFresh() {
    const getCached = unstable_cache(
      async (): Promise<NWACWeatherForecastDay | null> => {
        const wire = await v3Fetch(LATEST_PATH, nwacWeatherForecastsResponseSchema, {
          noStore: true,
        })
        return mapV3NWACWeatherForecastDay(wire)
      },
      ['nwac-weather-latest-fresh'],
      { revalidate: 30 },
    )
    return getCached()
  },

  async getDates(from, to) {
    const params = new URLSearchParams({ from, to })
    const rows = await v3Fetch(
      `nwac-weather/forecast/archive?${params}`,
      nwacWeatherArchiveSchema,
      CACHE,
    )
    return [...new Set(rows.map((r) => r.serviceDate))].sort()
  },
}
