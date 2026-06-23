/** Legacy v2 forecast source: fetches+parses the v2 response, maps it into the model. */
import type { ForecastResult } from '../../model/forecast'
import { fetchForecast } from '../../nac'
import type { ForecastSource } from '../types'
import { mapV2ForecastResult } from './mappers'

export const forecastSourceV2: ForecastSource = {
  async getForecast(centerId: string, zoneId: number): Promise<ForecastResult | null> {
    const wire = await fetchForecast(centerId, zoneId)
    return wire === null ? null : mapV2ForecastResult(wire)
  },
}
