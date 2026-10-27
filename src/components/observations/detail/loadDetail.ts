/**
 * Server-only: a record fetched from the observation source and prepared for the detail
 * components — for the record's own page, and for the modal's endpoint.
 */
import type { ObservationKind } from '@/services/nac/model/observation'
import { getObservationSource } from '@/services/nac/sources'

import type { DetailData } from './detailTypes'
import { prepareAvalancheDetail, prepareObservationDetail } from './prepareDetail'

/**
 * A record fetched and prepared, or `null` when the API has no public copy of it. Throws on a
 * failure, so callers can tell "not found" from "couldn't load".
 */
export async function loadDetail(
  center: string,
  kind: ObservationKind,
  id: string,
): Promise<DetailData | null> {
  const source = getObservationSource()
  if (kind === 'observation') {
    const observation = await source.getObservation(center, id)
    return observation && prepareObservationDetail(observation)
  }
  const avalanche = await source.getAvalanche(center, id)
  return avalanche && prepareAvalancheDetail(avalanche)
}
