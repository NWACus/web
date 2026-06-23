/** Legacy v2 warning source: fetches+parses the v2 response, maps it into the model. */
import type { WarningProduct } from '../../model/forecast'
import { fetchWarning } from '../../nac'
import type { WarningSource } from '../types'
import { mapV2Warning } from './mappers'

export const warningSourceV2: WarningSource = {
  async getWarning(centerId: string, zoneId: number): Promise<WarningProduct | null> {
    const wire = await fetchWarning(centerId, zoneId)
    return wire === null ? null : mapV2Warning(wire)
  },
}
