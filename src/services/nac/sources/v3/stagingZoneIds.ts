/**
 * Temporary, while a deployment reads v2 from production but v3 from staging: the two APIs number
 * avalanche zones differently, so staging's weather matches no production zone. Only East Slopes
 * Central is mapped. Does nothing once `NAC_V3_HOST` is unset, and can go then.
 */
import { nacApiHost, v3ApiHost } from '../../hosts'

const STAGING_V3_HOST = 'https://staging-api.avalanche.org'

const PRODUCTION_ZONE_ID_BY_STAGING_ID = new Map([[2170, 3030]])

/** The avalanche zone id a weather zone or point carries on this deployment. */
export function deployedZoneId(
  avalancheZoneId: number | null,
  v3Host: string = v3ApiHost,
  nacHost: string = nacApiHost,
): number | null {
  if (avalancheZoneId === null || v3Host !== STAGING_V3_HOST || nacHost === v3Host) {
    return avalancheZoneId
  }
  return PRODUCTION_ZONE_ID_BY_STAGING_ID.get(avalancheZoneId) ?? avalancheZoneId
}
