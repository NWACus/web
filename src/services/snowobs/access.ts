import { getAvalancheCenterMetadata } from '@/services/nac/nac'

// Free of the Payload config so collection code can import it without a cycle.
export const SNOWOBS_API = 'https://api.snowobs.com/wx/v1'

/**
 * SnowObs's nginx caches a response for 60s keyed on the URL alone, and adds CORS headers only
 * when the request carries an Origin — so an Origin-less server fetch of a URL the legacy widget
 * also uses breaks that widget in browsers until the entry expires. Send one on every request.
 */
export const SNOWOBS_ORIGIN_HEADER = { origin: 'https://avy-fx.org' }

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
