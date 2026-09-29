import { getAvalancheCenterMetadata } from '@/services/nac/nac'

// Free of the Payload config so collection code can import it without a cycle.
export const SNOWOBS_API = 'https://api.snowobs.com/wx/v1'

// Every server-side SnowObs request goes through here: SnowObs caches
// Origin-less responses without CORS headers, breaking the legacy widget (#1349).
export function snowObsFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('origin', 'https://avy-fx.org')
  return fetch(url, { ...init, headers })
}

// Matches SnowObs's own one-minute cache (#1351).
export const STATION_DATA_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=60'

export class SnowObsError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'SnowObsError'
  }
}

// The public token scopes every SnowObs call to the center's client, across sources.
export async function resolveSnowObsToken(centerSlug: string): Promise<string> {
  return (await resolveSnowObsAccess(centerSlug)).token
}

const PUBLIC_NETWORKS = new Set(['snotel', 'mesowest'])

export type SnowObsAccess = { token: string; ownSources: string[] }

export async function resolveSnowObsAccess(centerSlug: string): Promise<SnowObsAccess> {
  const metadata = await getAvalancheCenterMetadata(centerSlug)
  const stations = metadata.widget_config.stations
  if (!stations?.token) {
    throw new SnowObsError(`No SnowObs token in the AFP config for ${centerSlug}`)
  }
  return {
    token: stations.token,
    ownSources: (stations.sources ?? []).filter((s) => !PUBLIC_NETWORKS.has(s)),
  }
}
