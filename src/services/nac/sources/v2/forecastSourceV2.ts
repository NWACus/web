/** Legacy v2 forecast source: fetches+parses the v2 response, maps it into the model. */
import type { ForecastResult, ProductLookup } from '../../model/forecast'
import { fetchForecastFresh, fetchForecastLookup } from '../../nac'
import type { ForecastResult as V2ForecastResult } from '../../types/forecastSchemas'
import type { ForecastSource } from '../types'
import { mapV2ForecastResult } from './mappers'

/**
 * The product mapped into the model, or null for a stub that was never published (null
 * `updated_at`) — the widget's rule, and the dated views' since #1325. Both the cached and the fresh
 * read go through here, so a page and its freshness check agree on what "nothing published" is.
 */
function displayableForecast(wire: V2ForecastResult): ForecastResult | null {
  return wire.updated_at === null ? null : mapV2ForecastResult(wire)
}

async function lookupForecast(
  centerId: string,
  zoneId: number,
): Promise<ProductLookup<ForecastResult>> {
  const lookup = await fetchForecastLookup(centerId, zoneId)
  if (lookup.status !== 'found') return lookup

  const product = displayableForecast(lookup.product)
  return product ? { status: 'found', product } : { status: 'none' }
}

export const forecastSourceV2: ForecastSource = {
  lookupForecast,
  async getForecast(centerId: string, zoneId: number): Promise<ForecastResult | null> {
    const lookup = await lookupForecast(centerId, zoneId)
    return lookup.status === 'found' ? lookup.product : null
  },
  async getForecastFresh(centerId: string, zoneId: number): Promise<ForecastResult | null> {
    const wire = await fetchForecastFresh(centerId, zoneId)
    return wire === null ? null : displayableForecast(wire)
  },
}
