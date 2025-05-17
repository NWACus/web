import * as qs from 'qs-esm'
import { allAvalancheCenterCapabilitiesSchema, avalancheCenterSchema } from './types/schemas'

const host = 'https://api.avalanche.org'
const wordpressHost = 'https://forecasts.avalanche.org'

export async function nacFetch(path: string) {
  try {
    const url = `${host}/${path}`

    const data = await fetch(url, {
      next: {
        revalidate: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
      },
    })

    return data.json()
  } catch (error) {
    console.error('nacFetch error: ', error)
  }
}

export async function afpFetch(path: string) {
  try {
    const params = {
      rest_route: path,
    }
    const querystring = qs.stringify(params)
    const url = `${wordpressHost}/${path}?${querystring}`

    const data = await fetch(url, {
      next: {
        revalidate: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
      },
    })

    return data.json()
  } catch (error) {
    console.error('afpFetch error: ', error)
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

  const foundAvalancheCenterBySlug = allAvalancheCenterCapabilities.centers.find(
    (center) => center.id === centerSlug.toUpperCase(),
  )

  if (!foundAvalancheCenterBySlug) return null

  return foundAvalancheCenterBySlug.platforms
}

export async function getAvalancheCenterMetadata(centerSlug: string) {
  const metadata = await nacFetch(`/v2/public/avalanche-center/${centerSlug.toUpperCase()}`)

  const parsed = avalancheCenterSchema.safeParse(metadata)

  if (!parsed.success) {
    const errors = parsed.error.message
    throw new Error(`Failed to parse nac avalanche center metadata response: ${errors}`)
  }

  return parsed.data
}
