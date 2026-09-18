import { getAvalancheCenterMetadata } from '@/services/nac/nac'

// Kept free of the Payload config so collection code can import it without
// an import cycle through payload.config.ts.
export const SNOWOBS_API = 'https://api.snowobs.com/wx/v1'

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

// The center's SnowObs token lives in its AFP config
// (`widget_config.stations.token`), the same public token the legacy widgets
// use. It scopes every SnowObs call to the center's client, across sources.
export async function resolveSnowObsToken(centerSlug: string): Promise<string> {
  return (await resolveSnowObsAccess(centerSlug)).token
}

// Networks anyone can read; a center's own loggers report under any other
// source its AFP config lists (NWAC's under `nwac`).
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
