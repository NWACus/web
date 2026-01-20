import { normalizePath } from '@/utilities/path'
import config from '@payload-config'
import { getPayload } from 'payload'
import * as qs from 'qs-esm'
import { allAvalancheCenterCapabilitiesSchema, avalancheCenterSchema } from './types/schemas'

const host = process.env.NAC_HOST || 'https://api.avalanche.org'
const wordpressHost = process.env.AFP_HOST || 'https://forecasts.avalanche.org'

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
  const centerSlugToUse = centerSlug === 'dvac' ? 'nwac' : centerSlug

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
  const centerSlugToUse = centerSlug === 'dvac' ? 'nwac' : centerSlug
  const metadata = await nacFetch(`/v2/public/avalanche-center/${centerSlugToUse.toUpperCase()}`)

  const parsed = avalancheCenterSchema.safeParse(metadata)

  if (!parsed.success) {
    const errors = parsed.error.message
    throw new Error(`Failed to parse nac avalanche center metadata response: ${errors}`)
  }

  return parsed.data
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
  const centerSlugToUse = centerSlug === 'dvac' ? 'nwac' : centerSlug

  const avalancheCenterMetadata = await getAvalancheCenterMetadata(centerSlugToUse)
  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(centerSlugToUse)

  const forecastZones: ActiveForecastZoneWithSlug[] = []

  if (avalancheCenterMetadata && avalancheCenterPlatforms.forecasts) {
    const activeZones = avalancheCenterMetadata.zones.filter(
      (zone): zone is Extract<typeof zone, { status: 'active' }> => zone.status === 'active',
    )

    if (activeZones.length > 0) {
      if (activeZones.length === 1) {
        const zoneSlug = activeZones[0].url.split('/').filter(Boolean).pop()

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
          const zoneSlug = zone.url.split('/').filter(Boolean).pop()

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
