import { resolveSnowObsAccess } from '@/services/snowobs/access'
import { VALID_TENANT_SLUGS } from '@/utilities/tenancy/avalancheCenters'

// The registry lists a center's own loggers, reporting under the center's slug
// as their SnowObs source. A center renders the station routes when its AFP
// config declares that source; today that is NWAC alone.
export async function hasStationRegistry(center: string): Promise<boolean> {
  try {
    const { ownSources } = await resolveSnowObsAccess(center)
    return ownSources.includes(center)
  } catch {
    return false
  }
}

export async function stationRegistryCenters(): Promise<string[]> {
  const checks = await Promise.all(VALID_TENANT_SLUGS.map(hasStationRegistry))
  return VALID_TENANT_SLUGS.filter((_, i) => checks[i])
}
