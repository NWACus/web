/**
 * Server-side fetches from the public observation API (`/obs/v1/public`).
 *
 * Two things set it apart from `nacFetch`:
 *
 * - **Every request carries an `Origin`.** The API allowlists origins and answers a bare 401
 *   without one. A browser sets it for itself; Node does not, so these fetches send the tenant's
 *   avy-fx.org hostname — which the allowlist's `*.avy-fx.org` pattern accepts in every
 *   environment, including preview deploys whose own hostnames it rejects.
 * - **204 means "nothing here".** A detail route answers 204 for a missing, draft or private
 *   record, and a tile or zone route for an empty one. Those come back as `null`, distinct from a
 *   failure, which throws — so a page can say "not found" for one and "couldn't load" for the other.
 */
import { obsApiHost } from './hosts'
import { NACError, logNacError } from './nac'

const PUBLIC_PATH = '/obs/v1/public'

/** The `Origin` the obs API's allowlist accepts for a tenant. */
export function obsApiOrigin(centerSlug: string): string {
  return `https://${centerSlug}.avy-fx.org`
}

export function obsApiUrl(path: string, params?: URLSearchParams): string {
  const query = params?.toString()
  return `${obsApiHost}${PUBLIC_PATH}${path}${query ? `?${query}` : ''}`
}

interface ObsFetchOptions {
  /** Seconds in Next's data cache; omit to skip it (the route's own edge cache does the sharing). */
  cachedTime?: number
  tags?: string[]
}

function fetchInit(centerSlug: string, options: ObsFetchOptions): RequestInit {
  const headers = { Origin: obsApiOrigin(centerSlug) }
  if (options.cachedTime === undefined) return { headers, cache: 'no-store' }
  return {
    headers,
    next: {
      revalidate: options.cachedTime,
      ...(options.tags && options.tags.length > 0 ? { tags: options.tags } : {}),
    },
  }
}

async function obsFetch(
  centerSlug: string,
  url: string,
  options: ObsFetchOptions,
): Promise<Response | null> {
  let res: Response
  try {
    res = await fetch(url, fetchInit(centerSlug, options))
  } catch (error) {
    await logNacError(error, 'obsFetch error')
    throw new NACError('Failed to fetch from the observation API', error, { url })
  }
  if (res.status === 204) return null
  if (!res.ok) {
    const error = new NACError(`Observation API request failed with status ${res.status}`, null, {
      url,
      status: res.status,
      statusText: res.statusText,
    })
    await logNacError(error, 'obsFetch error')
    throw error
  }
  return res
}

/** Whether a failed request was the observation API answering with this status. */
export function isObsStatus(error: unknown, status: number): boolean {
  return error instanceof NACError && error.context?.status === status
}

/** Parsed JSON, or `null` for a 204. Throws `NACError` on any failure. */
export async function obsFetchJson(
  centerSlug: string,
  path: string,
  params?: URLSearchParams,
  options: ObsFetchOptions = {},
): Promise<unknown> {
  const url = obsApiUrl(path, params)
  const res = await obsFetch(centerSlug, url, options)
  if (!res) return null
  try {
    return await res.json()
  } catch (error) {
    await logNacError(error, 'obsFetch error')
    throw new NACError('Failed to parse observation API response as JSON', error, { url })
  }
}

/** A vector tile's bytes, or `null` for an empty tile (204). Throws `NACError` on any failure. */
export async function obsFetchBytes(
  centerSlug: string,
  path: string,
  params: URLSearchParams,
): Promise<ArrayBuffer | null> {
  const res = await obsFetch(centerSlug, obsApiUrl(path, params), {})
  return res ? res.arrayBuffer() : null
}
