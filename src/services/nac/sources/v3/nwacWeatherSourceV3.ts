/** NWAC's Mountain Weather Forecast from products-api v3 (`/v3/public/nwac-weather/…`). */
import { unstable_cache } from 'next/cache'

import type { NWACWeatherForecastDay } from '../../model/nwacWeather'
import { nwacWeatherCacheTag, nwacWeatherHistoricalCacheTag } from '../../nac'
import {
  nwacWeatherArchiveSchema,
  nwacWeatherForecastsResponseSchema,
} from '../../types/nwacWeatherSchemas'
import type { NWACWeatherSource } from '../types'
import { v3Fetch } from './fetch'
import { mapV3NWACWeatherForecastDay } from './nwacWeatherMappers'

const CACHE = { cachedTime: 300, tags: [nwacWeatherCacheTag] }
// A past date's forecast, or a window of past dates, no longer changes, so a publish must not
// purge it: its own tag keeps it out of the freshness route's reach.
const HISTORICAL_SECONDS = 30 * 24 * 60 * 60
const HISTORICAL_CACHE = { cachedTime: HISTORICAL_SECONDS, tags: [nwacWeatherHistoricalCacheTag] }

// With no date, v3 answers with the latest date that has a forecast.
const LATEST_PATH = 'nwac-weather/forecasts'

function dayPath(date: string) {
  return `${LATEST_PATH}?${new URLSearchParams({ date })}`
}

/** Thrown out of the long cache for a past day with no forecast: a throw stores nothing. */
class EmptyPastDay extends Error {}

/**
 * A past date's forecast. Only a forecast gets the long cache: a date can be published after it has
 * passed, and nothing purges the historical tag, so a cached "nothing" would hide it for 30 days.
 * Nothing is kept for `CACHE`'s few minutes instead, so a date with no forecast isn't re-read on
 * every request.
 */
async function readPastDay(date: string): Promise<NWACWeatherForecastDay | null> {
  const readRecent = unstable_cache(
    async () =>
      mapV3NWACWeatherForecastDay(
        await v3Fetch(dayPath(date), nwacWeatherForecastsResponseSchema, { noStore: true }),
      ),
    ['nwac-weather-past-day-recent', date],
    { revalidate: CACHE.cachedTime, tags: CACHE.tags },
  )
  const readKept = unstable_cache(
    async () => {
      const day = await readRecent()
      if (!day) throw new EmptyPastDay()
      return day
    },
    ['nwac-weather-past-day', date],
    { revalidate: HISTORICAL_SECONDS, tags: HISTORICAL_CACHE.tags },
  )
  return readKept().catch((error: unknown) => {
    if (error instanceof EmptyPastDay) return null
    throw error
  })
}

export const nwacWeatherSourceV3: NWACWeatherSource = {
  async getDay(date, { historical = false } = {}) {
    if (historical) return readPastDay(date)
    const wire = await v3Fetch(dayPath(date), nwacWeatherForecastsResponseSchema, CACHE)
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

  async getDates(from, to, { historical = false } = {}) {
    const params = new URLSearchParams({ from, to })
    const rows = await v3Fetch(
      `nwac-weather/forecast/archive?${params}`,
      nwacWeatherArchiveSchema,
      historical ? HISTORICAL_CACHE : CACHE,
    )
    return [...new Set(rows.map((r) => r.serviceDate))].sort()
  },
}
