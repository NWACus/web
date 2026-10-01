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

function dayPath(date: string) {
  return `nwac-weather/forecasts?${new URLSearchParams({ date })}`
}

export const nwacWeatherSourceV3: NWACWeatherSource = {
  async getDay(date) {
    const wire = await v3Fetch(dayPath(date), nwacWeatherForecastsResponseSchema, CACHE)
    return mapV3NWACWeatherForecastDay(wire)
  },

  // Half the on-view staleness budget, as `fetchForecastFresh` is; a rejection is never cached.
  async getDayFresh(date) {
    const getCached = unstable_cache(
      async (): Promise<NWACWeatherForecastDay | null> => {
        const wire = await v3Fetch(dayPath(date), nwacWeatherForecastsResponseSchema, {
          noStore: true,
        })
        return mapV3NWACWeatherForecastDay(wire)
      },
      ['nwac-weather-fresh', date],
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
