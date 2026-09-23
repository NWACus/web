import { normalizePath } from '@/utilities/path'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import * as qs from 'qs-esm'
import type { ArchiveProductSummary } from './archiveDates'
import { afpApiHost, nacApiHost } from './hosts'
import type { NwacWeatherQuery } from './sources/types'
import {
  forecastResultSchema,
  warningResultSchema,
  weatherSchema,
  type ForecastResult,
  type WarningResult,
  type Weather,
} from './types/forecastSchemas'
import {
  nwacWeatherForecastsResponseSchema,
  type NwacWeatherForecastsWire,
} from './types/nwacWeatherSchemas'
import { productListSchema } from './types/productListSchemas'
import {
  allAvalancheCenterCapabilitiesSchema,
  avalancheCenterSchema,
  mapLayerSchema,
} from './types/schemas'
import { zoneSlugFromUrl } from './zoneSlug'

// DVAC shares NWAC's upstream data, so map its slug to nwac for all NAC/AFP lookups.
const normalizeCenterSlug = (centerSlug: string) => (centerSlug === 'dvac' ? 'nwac' : centerSlug)

/**
 * Log an upstream failure without letting the logging become the failure.
 *
 * These paths run where the Payload logger may not be available — a suite that mocks `getPayload`,
 * or a failure early enough that the config never resolved. Previously a logger that came back
 * undefined threw a TypeError *from inside the catch block*, replacing the real cause (an upstream
 * 500, a misdirected host) with "Cannot read properties of undefined (reading 'logger')". Logging
 * is best-effort; the caller's own error handling is what callers depend on.
 */
async function logNacError(err: unknown, message: string): Promise<void> {
  try {
    const payload = await getPayload({ config })
    payload?.logger?.error({ err }, message)
  } catch {
    // Intentionally swallowed — see above.
  }
}

export class NACError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'NACError'
  }
}

type Options = {
  tags?: string[]
  // Seconds, matching Next's `next.revalidate`.
  cachedTime?: number | false
  // Skip Next's fetch-level data cache entirely (cache: 'no-store'). Use for responses too
  // large for the 2MB data cache (e.g. the full product archive), which are cached one layer
  // up via unstable_cache after being trimmed down.
  noStore?: boolean
}

const DEFAULT_CACHED_TIME_SECONDS = 24 * 60 * 60

function fetchInit(options: Options): RequestInit {
  if (options.noStore) {
    return { cache: 'no-store' }
  }

  return {
    next: {
      revalidate: options.cachedTime ?? DEFAULT_CACHED_TIME_SECONDS,
      // Spread as `{ tags }`; spreading the bare array sets numeric keys, leaving the fetch
      // untagged and revalidateTag a silent no-op.
      ...(options.tags && options.tags.length > 0 ? { tags: options.tags } : {}),
    },
  }
}

export async function nacFetch(path: string, options: Options = {}) {
  const normalizedPath = normalizePath(path)
  const url = `${nacApiHost}/${normalizedPath}`

  try {
    const res = await fetch(url, fetchInit(options))

    if (!res.ok) {
      throw new NACError(`NAC API request failed with status ${res.status}`, null, {
        url,
        status: res.status,
        statusText: res.statusText,
      })
    }

    const data = await res.json()
    return data
  } catch (error) {
    await logNacError(error, 'nacFetch error')

    if (error instanceof NACError) {
      throw error
    }

    if (error instanceof SyntaxError) {
      throw new NACError('Failed to parse NAC API response as JSON', error, { url })
    }

    throw new NACError('Failed to fetch from NAC API', error, { url })
  }
}

export async function afpFetch(path: string, options: Options = {}) {
  const normalizedPath = normalizePath(path)
  const params = {
    rest_route: `/${normalizedPath}`,
  }
  const querystring = qs.stringify(params)
  const url = `${afpApiHost}?${querystring}`

  try {
    const res = await fetch(url, fetchInit(options))

    if (!res.ok) {
      let errorData
      try {
        errorData = await res.json()
      } catch (_e) {
        // If we can't parse the error response as JSON, continue with the original error
        errorData = null
      }
      throw new NACError(
        `AFP (WordPress) API request failed with status ${res.status}`,
        errorData?.message,
        {
          url,
          status: res.status,
          statusText: res.statusText,
          errorData,
        },
      )
    }

    const data = await res.json()
    return data
  } catch (error) {
    await logNacError(error, 'afpFetch error')

    if (error instanceof NACError) {
      throw error
    }

    if (error instanceof SyntaxError) {
      throw new NACError('Failed to parse AFP (WordPress) API response as JSON', error, { url })
    }

    throw new NACError('Failed to fetch from AFP (WordPress) API', error, { url })
  }
}

export async function getAllAvalancheCenterCapabilities() {
  const data = await afpFetch('/v1/public/avalanche-centers')

  const parsed = allAvalancheCenterCapabilitiesSchema.safeParse(data)

  if (!parsed.success) {
    const errors = parsed.error.message
    throw new Error(`Failed to parse afp avalanche center capabilities response: ${errors}`)
  }

  return parsed.data
}

export async function getAvalancheCenterPlatforms(centerSlug: string) {
  const allAvalancheCenterCapabilities = await getAllAvalancheCenterCapabilities()
  const centerSlugToUse = normalizeCenterSlug(centerSlug)

  const foundAvalancheCenterBySlug = allAvalancheCenterCapabilities.centers.find(
    (center) => center.id === centerSlugToUse.toUpperCase(),
  )

  if (!foundAvalancheCenterBySlug)
    return {
      warnings: false,
      forecasts: false,
      stations: false,
      obs: false,
      weather: false,
    }

  return foundAvalancheCenterBySlug.platforms
}

export async function getAvalancheCenterMetadata(centerSlug: string) {
  const centerSlugToUse = normalizeCenterSlug(centerSlug)
  const metadata = await nacFetch(`/v2/public/avalanche-center/${centerSlugToUse.toUpperCase()}`)

  const parsed = avalancheCenterSchema.safeParse(metadata)

  if (!parsed.success) {
    const errors = parsed.error.message
    throw new Error(`Failed to parse nac avalanche center metadata response: ${errors}`)
  }

  return parsed.data
}

// Re-exported so server-side callers keep one import surface; the implementation lives in a
// dependency-free module because the danger map needs it in the browser.
export { zoneSlugFromUrl } from './zoneSlug'

export interface MapLayerOptions {
  /**
   * Historical danger for a past day, as `YYYY-MM-DD`. **Verified honored on the v2 path form**
   * (2026-08-07: `?day=2026-01-14` returns that day's ratings, not today's), which matters because
   * avy only ever exercised the query form. Dated responses are immutable, so they cache far
   * longer than the live one.
   */
  day?: string
  /**
   * Draw every NAC center's zones rather than one center's. The all-centers response omits
   * centers that opted out of the national map, and is a much larger payload.
   */
  allCenters?: boolean
}

/**
 * The Next data-cache tag for a center's map layer. Distinct per day so a dated request never
 * shares a cache entry with the live one.
 */
export function mapLayerCacheTag(centerSlug: string, day?: string): string {
  const center = normalizeCenterSlug(centerSlug.toLowerCase())
  return `map-layer:${center}:${day ?? 'current'}`
}

/** How long a live map layer is cached. Forecasts publish roughly daily. */
const MAP_LAYER_CACHE_SECONDS = 30 * 60
/** A past day's ratings can no longer change, so hold them for a day. */
const DATED_MAP_LAYER_CACHE_SECONDS = 24 * 60 * 60

export async function getMapLayer(centerSlug: string, options: MapLayerOptions = {}) {
  const centerSlugToUse = normalizeCenterSlug(centerSlug)
  // The all-centers route is the same path with the center segment omitted.
  const path = options.allCenters
    ? '/v2/public/products/map-layer'
    : `/v2/public/products/map-layer/${centerSlugToUse.toUpperCase()}`
  const query = options.day ? `?day=${encodeURIComponent(options.day)}` : ''

  const data = await nacFetch(`${path}${query}`, {
    cachedTime: options.day ? DATED_MAP_LAYER_CACHE_SECONDS : MAP_LAYER_CACHE_SECONDS,
    tags: [mapLayerCacheTag(options.allCenters ? 'all' : centerSlug, options.day)],
  })

  const parsed = mapLayerSchema.safeParse(data)

  if (!parsed.success) {
    throw new NACError(`Failed to parse nac map-layer response: ${parsed.error.message}`)
  }

  return parsed.data
}

// `getForecastZoneDanger` moved to `./dangerMap/mapLayer`, where it reads through MapLayerSource.
// It cannot live here: this module is what the v2 source *fetches with*, so importing the source
// back into it would be a cycle.

export type ActiveZone = Extract<
  Awaited<ReturnType<typeof getAvalancheCenterMetadata>>['zones'][number],
  { status: 'active' }
>

export type ActiveForecastZoneWithSlug = {
  slug: string
  zone: ActiveZone
}

export async function getActiveForecastZones(centerSlug: string) {
  const centerSlugToUse = normalizeCenterSlug(centerSlug)

  const avalancheCenterMetadata = await getAvalancheCenterMetadata(centerSlugToUse)
  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(centerSlugToUse)

  const forecastZones: ActiveForecastZoneWithSlug[] = []

  if (avalancheCenterMetadata && avalancheCenterPlatforms.forecasts) {
    const activeZones = avalancheCenterMetadata.zones.filter(
      (zone): zone is Extract<typeof zone, { status: 'active' }> => zone.status === 'active',
    )

    if (activeZones.length > 0) {
      if (activeZones.length === 1) {
        const zoneSlug = zoneSlugFromUrl(activeZones[0].url)

        if (zoneSlug) {
          forecastZones.push({
            slug: zoneSlug,
            zone: activeZones[0],
          })
        }
      } else {
        const zoneLinks = activeZones.sort(
          (zoneA, zoneB) => (zoneA.rank ?? Infinity) - (zoneB.rank ?? Infinity),
        )
        zoneLinks.forEach((zone) => {
          const zoneSlug = zoneSlugFromUrl(zone.url)

          if (zoneSlug) {
            forecastZones.push({
              slug: zoneSlug,
              zone,
            })
          }
        })
      }
    }
  }

  return forecastZones
}

/**
 * The Next data-cache tag for a zone's current forecast. The revalidate-on-view freshness handler
 * revalidates this tag when it detects a change, so a router.refresh() re-renders with fresh data
 * (and the forecast page's route cache is invalidated too). Kept consistent with fetchForecast.
 */
export function forecastCacheTag(centerId: string, zoneId: number): string {
  return `forecast:${normalizeCenterSlug(centerId.toLowerCase())}:${zoneId}`
}

/**
 * The Next data-cache tag for a weather product. The freshness handler revalidates this alongside
 * the forecast when a change is detected, so a forecast-triggered refresh doesn't render fresh
 * forecast text next to a stale (300s-cached) weather table.
 */
export function weatherCacheTag(weatherProductId: number): string {
  return `weather:${weatherProductId}`
}

/**
 * The Next data-cache tag for a center's CURRENT mountain-weather product (the `type=weather`
 * query, as opposed to a product fetched by id). The weather freshness handler revalidates this
 * when the current product changes, which also invalidates the weather page's route cache.
 */
export function currentWeatherCacheTag(centerId: string, zoneId: number): string {
  return `weather-current:${normalizeCenterSlug(centerId.toLowerCase())}:${zoneId}`
}

/**
 * The Next data-cache tag for NWAC's Mountain Weather Forecast reads. One tag for the product:
 * an issuance is published at most twice a day and every read is a 300s ISR entry, so there is
 * nothing finer worth addressing.
 */
export const nwacWeatherCacheTag = 'nwac-weather'

/**
 * The Next data-cache tag for a zone's active warning/watch/special. The warning freshness handler
 * revalidates this when a zone's alert changes, which also invalidates the route cache of any page
 * that rendered it — notably the (statically generated) home-page banner. Kept consistent with
 * fetchWarning.
 */
export function warningCacheTag(centerId: string, zoneId: number): string {
  return `warning:${normalizeCenterSlug(centerId.toLowerCase())}:${zoneId}`
}

export async function fetchForecast(
  centerId: string,
  zoneId: number,
): Promise<ForecastResult | null> {
  const centerIdToUse = normalizeCenterSlug(centerId.toLowerCase()).toUpperCase()

  try {
    const data = await nacFetch(
      `/v2/public/product?type=forecast&center_id=${centerIdToUse}&zone_id=${zoneId}`,
      { cachedTime: 300, tags: [forecastCacheTag(centerId, zoneId)] },
    )

    const parsed = forecastResultSchema.safeParse(data)
    if (!parsed.success) {
      await logNacError(parsed.error, 'Failed to parse forecast response')
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

/**
 * The zone's CURRENT forecast fetched fresh from upstream, held only on a short cache so a burst of
 * page views shares one upstream request rather than hitting the NAC API per view. Used only by the
 * revalidate-on-view freshness check to catch corrections/retractions faster than the page's ISR
 * window. Returns null when none is published or the response doesn't parse.
 *
 * Half the staleness budget: this window plus the freshness route's edge TTL is the total on-view
 * detection lag (see `@/utilities/freshnessResponses`), with the 300s ISR window behind it.
 */
export async function fetchForecastFresh(
  centerId: string,
  zoneId: number,
): Promise<ForecastResult | null> {
  const centerIdToUse = normalizeCenterSlug(centerId.toLowerCase()).toUpperCase()

  const getCached = unstable_cache(
    async () => {
      const data = await nacFetch(
        `/v2/public/product?type=forecast&center_id=${centerIdToUse}&zone_id=${zoneId}`,
        { noStore: true },
      )
      const parsed = forecastResultSchema.safeParse(data)
      return parsed.success ? parsed.data : null
    },
    ['nac-forecast-fresh', centerIdToUse, String(zoneId)],
    { revalidate: 30 },
  )

  try {
    return await getCached()
  } catch {
    return null
  }
}

export async function fetchWarning(
  centerId: string,
  zoneId: number,
): Promise<WarningResult | null> {
  const centerIdToUse = normalizeCenterSlug(centerId.toLowerCase()).toUpperCase()

  try {
    const data = await nacFetch(
      `/v2/public/product?type=warning&center_id=${centerIdToUse}&zone_id=${zoneId}`,
      { cachedTime: 300, tags: [warningCacheTag(centerId, zoneId)] },
    )

    const parsed = warningResultSchema.safeParse(data)
    if (!parsed.success) {
      await logNacError(parsed.error, 'Failed to parse warning response')
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

/**
 * The zone's CURRENT warning fetched fresh from upstream, held only on a short cache so a burst of
 * page views shares one upstream request rather than hitting the NAC API per view. Used only by the
 * warning freshness check, which catches an alert issued or lifted after the (ISR) home page was
 * rendered. Returns the v2 null-object or null exactly as fetchWarning does.
 *
 * Half the staleness budget: this window plus the freshness route's edge TTL is the total on-view
 * detection lag (see `@/utilities/freshnessResponses`), with the page's revalidate window behind it.
 */
export async function fetchWarningFresh(
  centerId: string,
  zoneId: number,
): Promise<WarningResult | null> {
  const centerIdToUse = normalizeCenterSlug(centerId.toLowerCase()).toUpperCase()

  const getCached = unstable_cache(
    async () => {
      const data = await nacFetch(
        `/v2/public/product?type=warning&center_id=${centerIdToUse}&zone_id=${zoneId}`,
        { noStore: true },
      )
      const parsed = warningResultSchema.safeParse(data)
      return parsed.success ? parsed.data : null
    },
    ['nac-warning-fresh', centerIdToUse, String(zoneId)],
    { revalidate: 30 },
  )

  try {
    return await getCached()
  } catch {
    return null
  }
}

/** A `date_start`/`date_end` window (YYYY-MM-DD) used to narrow the archive list server-side. */
export type ArchiveDateRange = { from: string; to: string }

/**
 * Fetch + trim the center's product archive (the list endpoint). The endpoint narrows
 * server-side by date range via `date_start`/`date_end` (the avy app relies on this; the
 * `type`/`zone_id` params are ignored). The *unfiltered* archive is ~13MB for NWAC — too
 * large for Next's 2MB fetch-data cache — so we always fetch uncached and immediately trim
 * to the small slice the date picker needs (cached one layer up via unstable_cache).
 */
async function fetchArchiveSummaries(
  centerSlugUpper: string,
  range?: ArchiveDateRange,
): Promise<ArchiveProductSummary[]> {
  const params = new URLSearchParams({ avalanche_center_id: centerSlugUpper })
  if (range) {
    params.set('date_start', range.from)
    params.set('date_end', range.to)
  }

  const data = await nacFetch(`/v2/public/products?${params.toString()}`, { noStore: true })

  const parsed = productListSchema.safeParse(data)
  if (!parsed.success) {
    await logNacError(parsed.error, 'Failed to parse product archive response')
    // Thrown rather than swallowed into []: an unparseable response is a broken archive, and the
    // archive browser has to tell that from an empty one. `fetchProductArchive` turns it back
    // into [] for the callers where the archive is a secondary feature.
    throw new NACError(`Failed to parse product archive response: ${parsed.error.message}`)
  }

  return parsed.data.map((item) => ({
    id: item.id,
    product_type: item.product_type,
    published_time: item.published_time,
    danger_rating: item.danger_rating ?? 0,
    author: item.author ?? null,
    updated_at: item.updated_at ?? null,
    forecast_zone: item.forecast_zone.map((zone) => ({ id: zone.id })),
  }))
}

/**
 * The center's product archive for a date window (default: the whole archive), trimmed and
 * cached server-side so a given window is fetched at most once per 30-minute window rather
 * than per view. Throws on upstream failure; a failed window is never cached, so the next
 * caller retries. Use this where an empty archive and a broken one must look different — the
 * archive browser, whose whole page is this list.
 */
export async function fetchProductArchiveOrThrow(
  centerSlug: string,
  range?: ArchiveDateRange,
): Promise<ArchiveProductSummary[]> {
  const centerSlugToUse = normalizeCenterSlug(centerSlug.toLowerCase()).toUpperCase()

  const getCached = unstable_cache(
    () => fetchArchiveSummaries(centerSlugToUse, range),
    ['nac-product-archive', centerSlugToUse, range?.from ?? 'all', range?.to ?? 'all'],
    { revalidate: 30 * 60 },
  )

  return getCached()
}

/**
 * `fetchProductArchiveOrThrow`, returning [] on failure so a page whose archive is a secondary
 * feature (the date picker) degrades gracefully rather than crashing. Callers filter the result
 * to a single zone with `buildZoneArchiveDates`.
 */
export async function fetchProductArchive(
  centerSlug: string,
  range?: ArchiveDateRange,
): Promise<ArchiveProductSummary[]> {
  try {
    return await fetchProductArchiveOrThrow(centerSlug, range)
  } catch {
    return []
  }
}

/**
 * Fetch a single historical product by id. Historical products are immutable, so this is
 * cached for a long time and deliberately does NOT use the live revalidate-on-view freshness
 * path — only the current-forecast view needs that. Returns the forecast/summary product, or
 * null when the id is missing or the response doesn't parse (e.g. a non-renderable type).
 */
export async function fetchProductById(id: number): Promise<ForecastResult | null> {
  try {
    const data = await nacFetch(`/v2/public/product/${id}`, {
      // Immutable: hold for 30 days. Dated views are cached, never freshness-checked.
      cachedTime: 30 * 24 * 60 * 60,
    })

    const parsed = forecastResultSchema.safeParse(data)
    if (!parsed.success) {
      await logNacError(parsed.error, 'Failed to parse product-by-id response')
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

/**
 * Fetch a mountain-weather product by id (the id carried on a forecast's
 * `weather_data.weather_product_id`). Weather is a live product like the forecast, so it uses the
 * same short 5-minute data cache rather than the immutable archive cache — so repeated views
 * share one upstream request per window rather than hitting the NAC API per render. Returns null
 * when the id is missing or the response doesn't parse.
 */
export async function fetchWeatherProduct(id: number): Promise<Weather | null> {
  try {
    const data = await nacFetch(`/v2/public/product/${id}`, {
      cachedTime: 300,
      tags: [weatherCacheTag(id)],
    })

    return await parseWeatherResponse(data)
  } catch {
    return null
  }
}

/**
 * Parse a weather product answer, by id or by `type=weather` query. v2 returns a 200 null-object
 * (avalanche_center: null, …) when the id is missing or the center has never published one.
 * That's "no weather product", not a malformed response, so it is null without logging noise.
 * (The other "none" answer, the legacy PHP error page, fails JSON parsing before reaching here.)
 */
async function parseWeatherResponse(data: unknown): Promise<Weather | null> {
  if (
    data &&
    typeof data === 'object' &&
    'avalanche_center' in data &&
    data.avalanche_center === null
  ) {
    return null
  }

  const parsed = weatherSchema.safeParse(data)
  if (!parsed.success) {
    await logNacError(parsed.error, 'Failed to parse weather product response')
    return null
  }

  return parsed.data
}

/**
 * The center's current mountain-weather product — the legacy widget's Weather tab query. The
 * product covers every zone, so any of the center's zone ids finds it; callers pass the first
 * active zone, as the widget did. Same short data cache as the forecast, tagged so the weather
 * freshness handler can purge it. Returns null when there is none or the response doesn't parse.
 */
export async function fetchCurrentWeatherProduct(
  centerId: string,
  zoneId: number,
): Promise<Weather | null> {
  const centerIdToUse = normalizeCenterSlug(centerId.toLowerCase()).toUpperCase()

  try {
    const data = await nacFetch(
      `/v2/public/product?type=weather&center_id=${centerIdToUse}&zone_id=${zoneId}`,
      { cachedTime: 300, tags: [currentWeatherCacheTag(centerId, zoneId)] },
    )

    return await parseWeatherResponse(data)
  } catch {
    return null
  }
}

/**
 * The center's current mountain-weather product fetched fresh (30s cache), for the weather
 * freshness check — the same shape as `fetchForecastFresh`, and the same half of the staleness
 * budget.
 */
export async function fetchCurrentWeatherProductFresh(
  centerId: string,
  zoneId: number,
): Promise<Weather | null> {
  const centerIdToUse = normalizeCenterSlug(centerId.toLowerCase()).toUpperCase()

  const getCached = unstable_cache(
    async () => {
      const data = await nacFetch(
        `/v2/public/product?type=weather&center_id=${centerIdToUse}&zone_id=${zoneId}`,
        { noStore: true },
      )
      // Parsed directly rather than through parseWeatherResponse: like the other fresh fetches,
      // this path is silent — the cached fetch already logged the same response's failure.
      const parsed = weatherSchema.safeParse(data)
      return parsed.success ? parsed.data : null
    },
    ['nac-weather-fresh', centerIdToUse, String(zoneId)],
    { revalidate: 30 },
  )

  try {
    return await getCached()
  } catch {
    return null
  }
}

/**
 * The mountain-weather product that was current on a calendar day (`YYYY-MM-DD`): v2 answers with
 * the latest weather product published on or before that date. Exists for the SNFAC forecasts
 * published before 2020-05-01, which predate `weather_data.weather_product_id` and so cannot point
 * at their weather (inventory row F26); see `getWeatherForForecast`. The answer is historical and
 * cannot change, so it takes the long default cache.
 */
export async function fetchWeatherProductForDate(
  centerId: string,
  zoneId: number,
  date: string,
): Promise<Weather | null> {
  const centerIdToUse = normalizeCenterSlug(centerId.toLowerCase()).toUpperCase()

  try {
    const data = await nacFetch(
      `/v2/public/product?type=weather&center_id=${centerIdToUse}&zone_id=${zoneId}&published_time=${encodeURIComponent(date)}`,
    )

    return await parseWeatherResponse(data)
  } catch {
    return null
  }
}

// ─── NWAC Mountain Weather Forecast (products-api) ───────────────────────────

/**
 * Whether the center publishes the in-house Mountain Weather Forecast. NWAC forecasts weather
 * itself rather than through the AFP, so its `platforms.weather` is false upstream and the
 * dashboard's "Show on public weather tab" switch (`widget_config.mwf.enabled`) is the gate.
 */
export async function isNwacWeatherEnabled(centerSlug: string): Promise<boolean> {
  if (nwacWeatherForcedCenters.has(normalizeCenterSlug(centerSlug).toLowerCase())) return true
  try {
    const metadata = await getAvalancheCenterMetadata(centerSlug)
    return metadata.widget_config.mwf?.enabled === true
  } catch {
    return false
  }
}

/**
 * Whether the center has a mountain weather product at all: the AFP weather platform, or NWAC's
 * in-house forecast, whose `platforms.weather` is hard-coded false upstream. Gates the weather
 * route, the provisioned nav page, and the zone page's weather slot.
 */
export async function centerHasWeather(centerSlug: string): Promise<boolean> {
  const [platforms, nwacWeather] = await Promise.all([
    getAvalancheCenterPlatforms(centerSlug),
    isNwacWeatherEnabled(centerSlug),
  ])
  return platforms.weather || nwacWeather
}

/**
 * `NWAC_WEATHER_FORCE_CENTERS` — comma-separated center slugs treated as NWAC-weather-enabled regardless
 * of the upstream switch. For local and preview builds while the AFP side is still off; never
 * set in production, where the dashboard's switch is the only authority.
 */
const nwacWeatherForcedCenters = new Set(
  (process.env.NWAC_WEATHER_FORCE_CENTERS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
)

/**
 * Every NWAC weather issuance published for a date, newest first. products-api serves this product for
 * one center, so the path carries no center segment. Null when nothing is published, on a bad
 * status, or on a response the schema rejects — the page degrades to "no forecast" rather than
 * failing.
 */
export async function fetchNwacWeatherForecasts(
  query: NwacWeatherQuery = {},
): Promise<NwacWeatherForecastsWire | null> {
  const params = new URLSearchParams()
  if (query.date) params.set('date', query.date)
  if (query.zone !== undefined && query.zone !== null && query.zone !== '') {
    params.set('zone', String(query.zone))
  }
  const search = params.toString()
  const path = `/v3/public/nwac-weather/forecasts${search ? `?${search}` : ''}`

  try {
    const data = await nacFetch(path, {
      cachedTime: 300,
      tags: [nwacWeatherCacheTag],
    })

    const parsed = nwacWeatherForecastsResponseSchema.safeParse(data)
    if (!parsed.success) {
      await logNacError(parsed.error, 'Failed to parse NWAC weather forecasts response')
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}
