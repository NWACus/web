import { normalizePath } from '@/utilities/path'
import config from '@payload-config'
import { getPayload } from 'payload'
import * as qs from 'qs-esm'
import {
  forecastResultSchema,
  warningResultSchema,
  type ForecastResult,
  type WarningResult,
} from './types/forecastSchemas'
import {
  allAvalancheCenterCapabilitiesSchema,
  avalancheCenterSchema,
  mapLayerSchema,
} from './types/schemas'

const host = process.env.NAC_HOST || 'https://api.avalanche.org'
const wordpressHost = process.env.AFP_HOST || 'https://forecasts.avalanche.org'

// DVAC shares NWAC's upstream data, so map its slug to nwac for all NAC/AFP lookups.
const normalizeCenterSlug = (centerSlug: string) => (centerSlug === 'dvac' ? 'nwac' : centerSlug)

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
  cachedTime?: number | false
}

export async function nacFetch(path: string, options: Options = {}) {
  const normalizedPath = normalizePath(path)
  const url = `${host}/${normalizedPath}`

  try {
    const res = await fetch(url, {
      next: {
        revalidate: options?.cachedTime ?? 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
        ...(options?.tags && options.tags.length > 0 ? options.tags : []),
      },
    })

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
    const payload = await getPayload({ config })
    payload.logger.error({ err: error }, 'nacFetch error')

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
  const url = `${wordpressHost}?${querystring}`

  try {
    const res = await fetch(url, {
      next: {
        revalidate: options?.cachedTime ?? 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
        ...(options?.tags && options.tags.length > 0 ? options.tags : []),
      },
    })

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
    const payload = await getPayload({ config })
    payload.logger.error({ err: error }, 'afpFetch error')

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

function zoneSlugFromUrl(url: string): string | undefined {
  return url.split('/').filter(Boolean).pop()
}

export async function getMapLayer(centerSlug: string) {
  const centerSlugToUse = normalizeCenterSlug(centerSlug)
  const data = await nacFetch(
    `/v2/public/products/map-layer/${centerSlugToUse.toUpperCase()}`,
    // Forecasts publish roughly daily; keep link previews current.
    { cachedTime: 30 * 60 },
  )

  const parsed = mapLayerSchema.safeParse(data)

  if (!parsed.success) {
    throw new NACError(`Failed to parse nac map-layer response: ${parsed.error.message}`)
  }

  return parsed.data
}

export async function getForecastZoneDanger(centerSlug: string, zoneSlug: string) {
  const mapLayer = await getMapLayer(centerSlug)

  const feature = mapLayer.features.find(
    (f) => f.properties.link && zoneSlugFromUrl(f.properties.link) === zoneSlug,
  )

  return feature?.properties ?? null
}

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

export async function fetchForecast(
  centerId: string,
  zoneId: number,
): Promise<ForecastResult | null> {
  const centerIdToUse = normalizeCenterSlug(centerId.toLowerCase()).toUpperCase()

  try {
    const data = await nacFetch(
      `/v2/public/product?type=forecast&center_id=${centerIdToUse}&zone_id=${zoneId}`,
      { cachedTime: 300 },
    )

    const parsed = forecastResultSchema.safeParse(data)
    if (!parsed.success) {
      const payload = await getPayload({ config })
      payload.logger.error({ err: parsed.error }, 'Failed to parse forecast response')
      return null
    }

    return parsed.data
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
      { cachedTime: 300 },
    )

    const parsed = warningResultSchema.safeParse(data)
    if (!parsed.success) {
      const payload = await getPayload({ config })
      payload.logger.error({ err: parsed.error }, 'Failed to parse warning response')
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

export { resolveZoneFromSlug } from './resolveZone'
