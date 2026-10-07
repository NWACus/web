'use server'

import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'

// The center's active zones in display order. The observations widget's zone filter
// accepts zone names and maps them to its own ids.
export async function getActiveZoneNames(centerSlug: string): Promise<string[]> {
  if (!isValidTenantSlug(centerSlug)) return []

  const metadata = await getAvalancheCenterMetadata(centerSlug)
  return (
    metadata.zones
      .filter((zone) => zone.status === 'active')
      // Unranked zones go last; MAX_SAFE_INTEGER, unlike Infinity, subtracts to 0 instead of NaN
      .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
      .map((zone) => zone.name)
  )
}
