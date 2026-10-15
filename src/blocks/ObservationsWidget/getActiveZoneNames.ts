'use server'

import { getAvalancheCenterMetadata, getCombinedObsZones } from '@/services/nac/nac'
import type { CombinedObsZone } from '@/services/nac/types/schemas'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'

// The zones an editor can start the observations widget on, as names: the widget's zone filter
// accepts names and maps them to its own ids. Prefers the widget's own list, which adds
// observation-only zones; falls back to forecast zones, as the widget does, if that list fails.
export async function getActiveZoneNames(centerSlug: string): Promise<string[]> {
  if (!isValidTenantSlug(centerSlug)) return []

  // nacFetch has already logged a failure
  const obsZones = await getCombinedObsZones(centerSlug).catch(() => [])
  return obsZones.length > 0 ? obsZoneNames(obsZones) : forecastZoneNames(centerSlug)
}

// In the widget's own order: forecast zones (priority 1) first, then by name
function obsZoneNames(zones: CombinedObsZone[]): string[] {
  return zones
    .filter((zone) => zone.status === 'active')
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
    .map((zone) => zone.name)
}

async function forecastZoneNames(centerSlug: string): Promise<string[]> {
  const metadata = await getAvalancheCenterMetadata(centerSlug)
  return (
    metadata.zones
      .filter((zone) => zone.status === 'active')
      // Unranked zones go last; MAX_SAFE_INTEGER, unlike Infinity, subtracts to 0 instead of NaN
      .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
      .map((zone) => zone.name)
  )
}
