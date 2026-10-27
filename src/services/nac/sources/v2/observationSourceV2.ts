/**
 * The observation source against the public observation API (`/obs/v1/public`) — what the legacy
 * widget reads. Fetching and the `Origin` rule live in `../../obsApi`; the translation in
 * `./observationMappers`.
 */
import { z } from 'zod'

import { normalizeCenterSlug } from '../../centerSlug'
import { NACError } from '../../nac'
import { obsFetchBytes, obsFetchJson } from '../../obsApi'
import { listParams } from '../../observations/listParams'
import {
  avalancheListSchema,
  avalancheRecordSchema,
  combinedZonesSchema,
  observationListSchema,
  observationRecordSchema,
} from '../../types/observationSchemas'
import type { ObservationSource } from '../types'
import { mapAvalanche, mapCombinedZones, mapObservation, mapPage } from './observationMappers'

/** Detail responses are cached upstream for 60s too (`cache-control: max-age=60`). */
const DETAIL_CACHE_SECONDS = 60
/** Zones change when a center redraws them, which is rare. */
const ZONES_CACHE_SECONDS = 60 * 60

function parse<T extends z.ZodTypeAny>(schema: T, data: unknown, what: string): z.infer<T> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new NACError(`Failed to parse observation API ${what}`, parsed.error)
  }
  return parsed.data
}

/** The API's own center id: lowercase on observation routes; dvac reads NWAC's records. */
function upstreamCenterId(centerSlug: string): string {
  return normalizeCenterSlug(centerSlug).toLowerCase()
}

export const observationSourceV2: ObservationSource = {
  async listObservations(centerSlug, request) {
    // The trailing slash matters: without it the API reads `list` as a record id.
    const data = await obsFetchJson(
      centerSlug,
      '/observation/list/',
      listParams(request, upstreamCenterId(centerSlug)),
    )
    return mapPage(parse(observationListSchema, data, 'observation list'), mapObservation)
  },

  async listAvalanches(centerSlug, request) {
    const data = await obsFetchJson(
      centerSlug,
      '/avalanche_observation/list/',
      listParams(request, upstreamCenterId(centerSlug)),
    )
    return mapPage(parse(avalancheListSchema, data, 'avalanche list'), mapAvalanche)
  },

  async getObservation(centerSlug, id) {
    const data = await obsFetchJson(
      centerSlug,
      `/observation/${encodeURIComponent(id)}`,
      undefined,
      {
        cachedTime: DETAIL_CACHE_SECONDS,
      },
    )
    return data === null
      ? null
      : mapObservation(parse(observationRecordSchema, data, 'observation'))
  },

  async getAvalanche(centerSlug, id) {
    const data = await obsFetchJson(
      centerSlug,
      `/avalanche_observation/${encodeURIComponent(id)}`,
      undefined,
      { cachedTime: DETAIL_CACHE_SECONDS },
    )
    return data === null ? null : mapAvalanche(parse(avalancheRecordSchema, data, 'avalanche'))
  },

  async getZones(centerSlug) {
    // Uppercase, and case-sensitive, on this route alone.
    const params = new URLSearchParams({ center_id: upstreamCenterId(centerSlug).toUpperCase() })
    const data = await obsFetchJson(centerSlug, '/obs_zone/combined_zones/', params, {
      cachedTime: ZONES_CACHE_SECONDS,
    })
    return data === null ? [] : mapCombinedZones(parse(combinedZonesSchema, data, 'zones'))
  },

  async getTile(centerSlug, kind, { z, x, y }, { from, to }) {
    const path = kind === 'observation' ? '/observation' : '/avalanche_observation'
    // Both dates, always: the API's defaults are evaluated once at import and go stale.
    const params = new URLSearchParams({ start_date: from, end_date: to })
    return obsFetchBytes(centerSlug, `${path}/tiles/${z}/${x}/${y}.mvt`, params)
  },
}
